import { env } from "@/config/env";
import { hashToken } from "@/utils/crypto";

export type SignalingEventType =
  | "room_state"
  | "offer"
  | "answer"
  | "candidate"
  | "peer_ready"
  | "peer_left"
  | "peer_connection_status"
  | "datachannel_fallback"
  | "error";

export type SignalingEventHandler = (payload: any) => void;

class SignalingService {
  private ws: WebSocket | null = null;
  private listeners = new Map<SignalingEventType, Set<SignalingEventHandler>>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private currentParticipantId: string | null = null;
  private currentToken: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private lastPongAt = 0;
  private lifecycleWatchersBound = false;
  private connectAttempt = 0;

  get roomId(): string | null {
    return this.currentRoomId;
  }

  get participantId(): string | null {
    return this.currentParticipantId;
  }

  get isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  on(event: SignalingEventType, handler: SignalingEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit(event: SignalingEventType, payload: any): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error("Signaling event error [%s]:", event, err);
      }
    });
  }

  private handleLifecycleEvent = () => {
    // When returning to app (screen unblanked, tab foregrounded, network online)
    if (this.intentionalClose || !this.currentRoomId || !this.currentToken) return;

    const isStale = this.lastPongAt > 0 && Date.now() - this.lastPongAt > 25000;
    const isDisconnected = !this.ws || this.ws.readyState !== WebSocket.OPEN;

    if (isDisconnected || isStale) {
      console.log("[Signaling] Foreground/online wake-up: refreshing signaling connection...");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.connect(this.currentRoomId, this.currentToken, this.currentParticipantId!);
    }
  };

  private bindLifecycleWatchers(): void {
    if (this.lifecycleWatchersBound || typeof window === "undefined") return;
    window.addEventListener("online", this.handleLifecycleEvent);
    document.addEventListener("visibilitychange", this.handleLifecycleEvent);
    this.lifecycleWatchersBound = true;
  }

  private unbindLifecycleWatchers(): void {
    if (!this.lifecycleWatchersBound || typeof window === "undefined") return;
    window.removeEventListener("online", this.handleLifecycleEvent);
    document.removeEventListener("visibilitychange", this.handleLifecycleEvent);
    this.lifecycleWatchersBound = false;
  }

  async connect(roomId: string, token: string, participantId: string): Promise<void> {
    const attempt = ++this.connectAttempt;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.intentionalClose = false;
    this.currentRoomId = roomId;
    this.currentToken = token;
    this.currentParticipantId = participantId;
    this.bindLifecycleWatchers();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }

    const tokenHash = token ? await hashToken(token) : "";
    if (attempt !== this.connectAttempt || this.intentionalClose) return;
    const wsUrl = `${env.signalingUrl}/api/rooms/${roomId}/ws?tokenHash=${tokenHash}&participantId=${participantId}`;

    // Set up BroadcastChannel fallback for multi-tab local dev/offline
    if (!this.broadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel(`kunektayo_room_${roomId}`);
        this.broadcastChannel.onmessage = (e) => {
          const msg = e.data;
          if (msg && msg.senderId !== this.currentParticipantId) {
            this.emit(msg.type, msg);
          }
        };
      } catch {
        // BroadcastChannel not available in all webviews
      }
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastPongAt = Date.now();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") {
            this.lastPongAt = Date.now();
            return;
          }
          this.emit(data.type, data);
        } catch {
          // Non-JSON message
        }
      };

      this.ws.onerror = () => {
        // Fallback to BroadcastChannel locally
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch {
      // Local fallback active
    }
  }

  private scheduleReconnect(): void {
    // Resilient exponential backoff reconnect: keeps retrying while room is active
    if (this.reconnectTimer || this.intentionalClose || !this.currentRoomId || !this.currentToken) return;
    const delay = Math.min(1000 * Math.pow(1.5, Math.min(this.reconnectAttempts, 6)), 5000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose && this.currentRoomId && this.currentToken) {
        this.connect(this.currentRoomId, this.currentToken, this.currentParticipantId!);
      }
    }, delay);
  }

  send(type: string, payload: any): void {
    const message = {
      type,
      senderId: this.currentParticipantId,
      timestamp: Date.now(),
      ...payload,
    };

    // Send over WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch {
        // Fallback to broadcast
      }
    }

    // Always mirror through local BroadcastChannel for same-origin multi-tab testing
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {
        // Ignore
      }
    }
  }

  sendOffer(sdp: RTCSessionDescriptionInit): void {
    this.send("offer", { sdp });
  }

  sendAnswer(sdp: RTCSessionDescriptionInit): void {
    this.send("answer", { sdp });
  }

  sendCandidate(candidate: RTCIceCandidateInit): void {
    this.send("candidate", { candidate });
  }

  sendReady(): void {
    this.send("peer_ready", {});
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Silent half-open connection / dead socket check:
        // If we haven't received a pong in 30 seconds despite being OPEN, force-reconnect
        if (this.lastPongAt > 0 && Date.now() - this.lastPongAt > 30000) {
          console.warn("[Signaling] Zombie connection detected (no pong in 30s). Reconnecting...");
          try {
            this.ws.close();
          } catch {
            // Ignore
          }
          this.stopHeartbeat();
          this.scheduleReconnect();
          return;
        }

        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch {
          // Socket error
        }
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.connectAttempt++;
    this.intentionalClose = true;
    this.unbindLifecycleWatchers();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.lastPongAt = 0;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {
        // Ignore
      }
      this.broadcastChannel = null;
    }
    this.currentRoomId = null;
    this.currentToken = null;
    this.currentParticipantId = null;
  }
}

export const signalingService = new SignalingService();
