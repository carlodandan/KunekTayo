import { env } from "@/config/env";
import { hashToken } from "@/utils/crypto";

export type SignalingEventType =
  | "room_state"
  | "offer"
  | "answer"
  | "candidate"
  | "peer_ready"
  | "peer_left"
  | "error";

export type SignalingEventHandler = (payload: any) => void;

class SignalingService {
  private ws: WebSocket | null = null;
  private listeners = new Map<SignalingEventType, Set<SignalingEventHandler>>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private currentParticipantId: string | null = null;

  get roomId(): string | null {
    return this.currentRoomId;
  }

  get participantId(): string | null {
    return this.currentParticipantId;
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
        console.error(`Signaling event error [${event}]:`, err);
      }
    });
  }

  async connect(roomId: string, token: string, participantId: string): Promise<void> {
    this.disconnect();
    this.currentRoomId = roomId;
    this.currentParticipantId = participantId;

    const tokenHash = token ? await hashToken(token) : "";
    const wsUrl = `${env.signalingUrl}/api/rooms/${roomId}/ws?tokenHash=${tokenHash}&participantId=${participantId}`;

    // Set up BroadcastChannel fallback for multi-tab local dev/offline
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

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;
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
      };
    } catch {
      // Local fallback active
    }
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
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.currentRoomId = null;
    this.currentParticipantId = null;
  }
}

export const signalingService = new SignalingService();
