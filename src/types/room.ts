/**
 * Room and Participant types
 */

export type RoomStatus =
  | "idle"
  | "creating"
  | "waiting"
  | "active"
  | "reconnecting"
  | "expired"
  | "closed";

export type ParticipantRole = "host" | "guest";

export interface Participant {
  readonly id: string;
  readonly role: ParticipantRole;
  readonly displayName?: string;
  readonly joinedAt: number;
  readonly isAudioActive: boolean;
  readonly isVideoActive: boolean;
}

export interface RoomSession {
  readonly roomId: string;
  readonly inviteToken: string;
  readonly status: RoomStatus;
  readonly participants: readonly Participant[];
  readonly createdAt: number;
  readonly soloExpiresAt: number | null; // Timestamp when room will close if 2nd participant doesn't join
}

export interface CreateRoomResponse {
  readonly roomId: string;
  readonly inviteToken: string;
  readonly inviteUrl: string;
  readonly expiresAt: number;
}
