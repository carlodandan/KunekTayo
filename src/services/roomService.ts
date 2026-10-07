import { env } from "@/config/env";
import {
  CreateRoomResponse,
  JoinRoomResponse,
  RejoinSession,
  RoomError,
  RoomSession,
} from "@/types/room";
import {
  generateRoomId,
  generateInviteToken,
  generateParticipantId,
  hashToken,
  buildInviteUrl,
} from "@/utils/crypto";

const REJOIN_STORAGE_KEY = "kunektayo_active_rejoin_session";
const SOLO_TIMEOUT_MS = env.roomSoloTimeoutMinutes * 60 * 1000;

/**
 * Local in-memory coordinator providing authoritative fallback when offline or in dev
 */
class LocalRoomCoordinator {
  private rooms = new Map<string, {
    roomId: string;
    tokenHash: string;
    status: "waiting" | "active" | "expired" | "closed";
    participants: Array<{ id: string; role: "host" | "guest"; joinedAt: number }>;
    soloExpiresAt: number | null;
    createdAt: number;
    timer?: ReturnType<typeof setTimeout>;
  }>();

  create(roomId: string, tokenHash: string, hostId: string): RoomSession {
    const now = Date.now();
    const soloExpiresAt = now + SOLO_TIMEOUT_MS;

    const entry = {
      roomId,
      tokenHash,
      status: "waiting" as const,
      participants: [{ id: hostId, role: "host" as const, joinedAt: now }],
      soloExpiresAt,
      createdAt: now,
      timer: setTimeout(() => {
        const r = this.rooms.get(roomId);
        if (r && r.participants.length < 2) {
          r.status = "expired";
        }
      }, SOLO_TIMEOUT_MS),
    };

    this.rooms.set(roomId, entry);

    return {
      roomId,
      inviteToken: "",
      status: "waiting",
      myRole: "host",
      myParticipantId: hostId,
      participants: [{
        id: hostId,
        role: "host",
        joinedAt: now,
        isAudioActive: true,
        isVideoActive: true,
      }],
      createdAt: now,
      soloExpiresAt,
    };
  }

  join(roomId: string, tokenHash: string, participantId: string): JoinRoomResponse {
    const room = this.rooms.get(roomId);
    if (!room || room.status === "expired" || room.status === "closed") {
      throw { code: "ROOM_EXPIRED", message: "Room has expired or does not exist." } as RoomError;
    }

    if (room.tokenHash && tokenHash && room.tokenHash !== tokenHash) {
      throw { code: "INVALID_TOKEN", message: "Invalid room invite token." } as RoomError;
    }

    const existing = room.participants.find((p) => p.id === participantId);
    if (existing) {
      return {
        roomId,
        status: room.status,
        role: existing.role,
        participantId,
        participants: room.participants.map((p) => ({
          id: p.id,
          role: p.role,
          joinedAt: p.joinedAt,
          isAudioActive: true,
          isVideoActive: true,
        })),
        soloExpiresAt: room.soloExpiresAt,
      };
    }

    if (room.participants.length >= 2) {
      throw {
        code: "ROOM_FULL",
        message: "Room is full. KunekTayo allows a maximum of 2 participants.",
      } as RoomError;
    }

    const now = Date.now();
    room.participants.push({ id: participantId, role: "guest", joinedAt: now });
    room.status = "active";
    room.soloExpiresAt = null;
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = undefined;
    }

    return {
      roomId,
      status: "active",
      role: "guest",
      participantId,
      participants: room.participants.map((p) => ({
        id: p.id,
        role: p.role,
        joinedAt: p.joinedAt,
        isAudioActive: true,
        isVideoActive: true,
      })),
      soloExpiresAt: null,
    };
  }

  leave(roomId: string, participantId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants = room.participants.filter((p) => p.id !== participantId);
    if (room.participants.length === 0) {
      room.status = "closed";
      if (room.timer) clearTimeout(room.timer);
      this.rooms.delete(roomId);
    } else {
      const now = Date.now();
      room.status = "waiting";
      room.soloExpiresAt = now + SOLO_TIMEOUT_MS;
      if (room.timer) clearTimeout(room.timer);
      room.timer = setTimeout(() => {
        if (room.participants.length < 2) {
          room.status = "expired";
        }
      }, SOLO_TIMEOUT_MS);
    }
  }

  get(roomId: string) {
    return this.rooms.get(roomId);
  }
}

const localCoordinator = new LocalRoomCoordinator();

export const roomService = {
  /**
   * Create a new room with a cryptographically secure token and participant ID
   */
  async createRoom(): Promise<CreateRoomResponse> {
    const roomId = generateRoomId();
    const inviteToken = generateInviteToken();
    const hostParticipantId = generateParticipantId();
    const inviteTokenHash = await hashToken(inviteToken);
    const inviteUrl = buildInviteUrl(roomId, inviteToken);
    const expiresAt = Date.now() + SOLO_TIMEOUT_MS;

    try {
      const response = await fetch(`${env.signalingUrl.replace("ws", "http")}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, inviteTokenHash, hostParticipantId }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch {
      // In offline/dev environment or before server deployment, register with local coordinator
      localCoordinator.create(roomId, inviteTokenHash, hostParticipantId);
    }

    // Persist rejoin session
    this.saveRejoinSession({
      roomId,
      inviteToken,
      participantId: hostParticipantId,
      role: "host",
      lastActiveAt: Date.now(),
    });

    return {
      roomId,
      inviteToken,
      inviteUrl,
      expiresAt,
      hostParticipantId,
    };
  },

  /**
   * Join an existing room via room ID and optional token
   */
  async joinRoom(
    roomId: string,
    inviteToken: string,
    existingParticipantId?: string
  ): Promise<JoinRoomResponse> {
    const participantId = existingParticipantId || generateParticipantId();
    const inviteTokenHash = inviteToken ? await hashToken(inviteToken) : "";

    try {
      const response = await fetch(
        `${env.signalingUrl.replace("ws", "http")}/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId, inviteTokenHash }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: errorData.code || "NETWORK_ERROR",
          message: errorData.error || `HTTP ${response.status}`,
        } as RoomError;
      }

      const data = await response.json();
      const role = data.role || "guest";

      this.saveRejoinSession({
        roomId,
        inviteToken,
        participantId,
        role,
        lastActiveAt: Date.now(),
      });

      return {
        roomId,
        status: data.state.status,
        role,
        participantId,
        participants: data.state.participants,
        soloExpiresAt: data.state.soloExpiresAt,
      };
    } catch (err: unknown) {
      const typedErr = err as RoomError;
      if (typedErr && typedErr.code === "ROOM_FULL") {
        throw typedErr;
      }

      // Check local coordinator fallback
      const localResult = localCoordinator.join(roomId, inviteTokenHash, participantId);
      this.saveRejoinSession({
        roomId,
        inviteToken,
        participantId,
        role: localResult.role,
        lastActiveAt: Date.now(),
      });
      return localResult;
    }
  },

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    try {
      await fetch(
        `${env.signalingUrl.replace("ws", "http")}/api/rooms/${roomId}/leave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        }
      );
    } catch {
      localCoordinator.leave(roomId, participantId);
    } finally {
      this.clearRejoinSession();
    }
  },

  /**
   * Rejoin session persistence
   */
  saveRejoinSession(session: RejoinSession): void {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.setItem(REJOIN_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Storage quota / restricted
      }
    }
  },

  getRejoinSession(): RejoinSession | null {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(REJOIN_STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw) as RejoinSession;
        }
      } catch {
        return null;
      }
    }
    return null;
  },

  clearRejoinSession(): void {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.removeItem(REJOIN_STORAGE_KEY);
      } catch {
        // Storage quota / restricted
      }
    }
  },
};
