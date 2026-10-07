/**
 * WebRTC and Signaling Types
 */

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface MediaDeviceState {
  readonly audioInputId?: string;
  readonly videoInputId?: string;
  readonly isMuted: boolean;
  readonly isCameraOff: boolean;
  readonly isScreenSharing: boolean;
}

export interface EphemeralMessage {
  readonly id: string;
  readonly senderId: string;
  readonly text: string;
  readonly createdAt: number;
  readonly ttlSeconds: number;
  readonly expiresAt: number;
  readonly status: "sending" | "delivered" | "expired";
}

export interface SignalingMessage {
  readonly type: "offer" | "answer" | "candidate" | "join" | "leave" | "ping";
  readonly senderId: string;
  readonly roomId: string;
  readonly payload?: unknown;
  readonly timestamp: number;
}
