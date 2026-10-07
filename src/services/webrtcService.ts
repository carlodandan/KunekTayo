import { env } from "@/config/env";
import { signalingService } from "./signalingService";

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface MediaState {
  isMuted: boolean;
  isCameraOff: boolean;
}

export type WebRtcEventListener = (data: any) => void;

class WebRtcService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isOfferer = false;
  private isMuted = false;
  private isCameraOff = false;
  private candidateQueue: RTCIceCandidateInit[] = [];
  private listeners = new Map<string, Set<WebRtcEventListener>>();
  private connectionState: PeerConnectionState = "new";

  on(event: string, listener: WebRtcEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.error(`WebRTC event [${event}] error:`, err);
      }
    });
  }

  getState(): {
    connectionState: PeerConnectionState;
    isMuted: boolean;
    isCameraOff: boolean;
    hasLocalStream: boolean;
    hasRemoteStream: boolean;
  } {
    return {
      connectionState: this.connectionState,
      isMuted: this.isMuted,
      isCameraOff: this.isCameraOff,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
    };
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  /**
   * Request user camera and microphone
   */
  async startLocalMedia(audio = true, video = true): Promise<MediaStream | null> {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("MediaDevices API is not available on this platform.");
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });

      this.emit("local_stream", this.localStream);
      return this.localStream;
    } catch (err: unknown) {
      console.warn("getUserMedia failed or denied:", err);
      this.emit("media_error", err);
      return null;
    }
  }

  private dataChannel: RTCDataChannel | null = null;

  /**
   * Initialize RTCPeerConnection and wire signaling handlers
   */
  initPeerConnection(isHost: boolean): void {
    this.closePeerConnection();
    this.isOfferer = isHost;
    this.remoteStream = new MediaStream();

    const config: RTCConfiguration = {
      iceServers: env.defaultStunServers.map((url) => ({ urls: url })),
      iceCandidatePoolSize: 2,
    };

    const pc = new RTCPeerConnection(config);
    this.peerConnection = pc;

    // Attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Set up Ephemeral Chat DataChannel
    if (isHost) {
      try {
        const dc = pc.createDataChannel("ephemeral-chat", {
          ordered: true,
          maxPacketLifeTime: 3000,
        });
        this.setupDataChannel(dc);
      } catch (err) {
        console.error("Failed to create RTCDataChannel:", err);
      }
    } else {
      pc.ondatachannel = (event) => {
        if (event.channel.label === "ephemeral-chat") {
          this.setupDataChannel(event.channel);
        }
      };
    }

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!this.remoteStream?.getTracks().includes(track)) {
          this.remoteStream?.addTrack(track);
        }
      });
      this.emit("remote_stream", this.remoteStream);
    };

    // Gather and relay ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.sendCandidate(event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      const state = (pc.connectionState as PeerConnectionState) || "new";
      this.connectionState = state;
      this.emit("connection_state", state);

      if (state === "failed") {
        this.restartIce();
      }
    };

    // Attach signaling listeners
    this.wireSignaling();
  }

  private wireSignaling(): void {
    signalingService.on("offer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
      if (!this.peerConnection || this.isOfferer) return;

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        this.processQueuedCandidates();

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        signalingService.sendAnswer(answer);
      } catch (err) {
        console.error("Failed to handle WebRTC offer:", err);
      }
    });

    signalingService.on("answer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
      if (!this.peerConnection || !this.isOfferer) return;

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        this.processQueuedCandidates();
      } catch (err) {
        console.error("Failed to handle WebRTC answer:", err);
      }
    });

    signalingService.on("candidate", async (payload: { candidate: RTCIceCandidateInit }) => {
      if (!this.peerConnection) return;

      if (!this.peerConnection.remoteDescription) {
        this.candidateQueue.push(payload.candidate);
        return;
      }

      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });
  }

  private async processQueuedCandidates(): Promise<void> {
    if (!this.peerConnection) return;
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add queued candidate:", err);
        }
      }
    }
  }

  /**
   * Initiate offer creation when ready
   */
  async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection || !this.isOfferer) return;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.peerConnection.setLocalDescription(offer);
      signalingService.sendOffer(offer);
    } catch (err) {
      console.error("Failed to create WebRTC offer:", err);
    }
  }

  /**
   * ICE Restart
   */
  async restartIce(): Promise<void> {
    if (!this.peerConnection || !this.isOfferer) return;

    try {
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      signalingService.sendOffer(offer);
    } catch (err) {
      console.error("ICE restart failed:", err);
    }
  }

  toggleMicrophone(): boolean {
    if (!this.localStream) return this.isMuted;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
      this.emit("media_state", { isMuted: this.isMuted, isCameraOff: this.isCameraOff });
    }
    return this.isMuted;
  }

  toggleCamera(): boolean {
    if (!this.localStream) return this.isCameraOff;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCameraOff = !videoTrack.enabled;
      this.emit("media_state", { isMuted: this.isMuted, isCameraOff: this.isCameraOff });
    }
    return this.isCameraOff;
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    this.dataChannel = dc;

    dc.onopen = () => {
      this.emit("datachannel_state", "open");
    };

    dc.onclose = () => {
      this.emit("datachannel_state", "closed");
    };

    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.emit("datachannel_message", payload);
      } catch (err) {
        console.error("Failed to parse DataChannel message:", err);
      }
    };
  }

  sendDataChannelMessage(payload: any): boolean {
    const serialized = JSON.stringify(payload);
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      try {
        this.dataChannel.send(serialized);
        return true;
      } catch (err) {
        console.error("DataChannel send failed:", err);
      }
    }

    // Mirror to signaling / broadcast fallback if DataChannel is connecting or offline
    signalingService.send("datachannel_fallback", payload);
    return false;
  }

  closePeerConnection(): void {
    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch {
        // Ignore
      }
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.candidateQueue = [];
    this.connectionState = "closed";
    this.emit("connection_state", "closed");
  }

  stopAllMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.closePeerConnection();
    this.isMuted = false;
    this.isCameraOff = false;
  }
}

export const webrtcService = new WebRtcService();
