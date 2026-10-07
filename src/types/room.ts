/**
 * Room and Participant domain types
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
  readonly myRole: ParticipantRole;
  readonly myParticipantId: string;
  readonly participants: readonly Participant[];
  readonly createdAt: number;
  readonly soloExpiresAt: number | null; // Timestamp when room will close if 2nd participant doesn't join
}

export interface CreateRoomResponse {
  readonly roomId: string;
  readonly inviteToken: string;
  readonly inviteUrl: string;
  readonly expiresAt: number;
  readonly hostParticipantId: string;
}

export interface JoinRoomResponse {
  readonly roomId: string;
  readonly status: RoomStatus;
  readonly role: ParticipantRole;
  readonly participantId: string;
  readonly participants: readonly Participant[];
  readonly soloExpiresAt: number | null;
}

export interface RejoinSession {
  readonly roomId: string;
  readonly inviteToken: string;
  readonly participantId: string;
  readonly role: ParticipantRole;
  readonly lastActiveAt: number;
}

export type RoomErrorCode =
  | "ROOM_FULL"
  | "ROOM_EXPIRED"
  | "INVALID_TOKEN"
  | "NOT_FOUND"
  | "NETWORK_ERROR";

export interface RoomError {
  readonly code: RoomErrorCode;
  readonly message: string;
}
