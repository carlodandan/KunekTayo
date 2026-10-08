import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Participant,
  RejoinSession,
  RoomError,
  RoomSession,
  RoomStatus,
} from "@/types/room";
import { roomService } from "@/services/roomService";
import { signalingService } from "@/services/signalingService";
import { buildInviteUrl } from "@/utils/crypto";
import { notifyNativeCallState } from "@/services/androidPipService";

interface RoomContextValue {
  session: RoomSession | null;
  status: RoomStatus;
  isLoading: boolean;
  error: RoomError | null;
  inviteUrl: string;
  hasRejoinableSession: boolean;
  timeRemaining: {
    minutes: number;
    seconds: number;
    isExpired: boolean;
    formatted: string;
  } | null;
  createRoom: () => Promise<void>;
  joinRoom: (roomId: string, token?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  rejoinLastRoom: () => Promise<void>;
  simulateSecondParticipantJoin: () => void;
  simulateSecondParticipantLeave: () => void;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<RoomSession | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RoomError | null>(null);
  const [rejoinSession, setRejoinSession] = useState<RejoinSession | null>(null);
  const [now, setNow] = useState(Date.now());

  // CheckIcon for cached rejoin session on mount
  useEffect(() => {
    const cached = roomService.getRejoinSession();
    if (cached) {
      setRejoinSession(cached);
    }
  }, []);

  // Sync active call state with native Android container (PiP & Foreground Service)
  useEffect(() => {
    notifyNativeCallState(status === "active");
  }, [status]);

  // 1-second clock for solo countdown calculation
  useEffect(() => {
    if (!session?.soloExpiresAt || status !== "waiting") return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (session.soloExpiresAt && current >= session.soloExpiresAt) {
        setStatus("expired");
        setSession((prev) => (prev ? { ...prev, status: "expired" } : null));
        roomService.clearRejoinSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.soloExpiresAt, status]);

  // Connect signaling whenever active session changes
  useEffect(() => {
    if (!session) {
      signalingService.disconnect();
      return;
    }

    signalingService.connect(session.roomId, session.inviteToken, session.myParticipantId);

    const unsubState = signalingService.on("room_state", (payload: any) => {
      if (payload.state) {
        setStatus(payload.state);
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: payload.state,
            soloExpiresAt: payload.soloExpiresAt,
            participants: payload.participants || prev.participants,
          };
        });
      }
    });

    const unsubPeerJoined = signalingService.on("peer_ready", () => {
      setStatus("active");
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "active",
          soloExpiresAt: null,
        };
      });
    });

    return () => {
      unsubState();
      unsubPeerJoined();
    };
  }, [session?.roomId, session?.inviteToken, session?.myParticipantId]);

  // Compute countdown object
  const computeTimeRemaining = () => {
    if (!session?.soloExpiresAt || status !== "waiting") return null;

    const diff = session.soloExpiresAt - now;
    if (diff <= 0) {
      return { minutes: 0, seconds: 0, isExpired: true, formatted: "00:00" };
    }

    const totalSecs = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return { minutes, seconds, isExpired: false, formatted };
  };

  const createRoom = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus("creating");

    try {
      const result = await roomService.createRoom();
      const newSession: RoomSession = {
        roomId: result.roomId,
        inviteToken: result.inviteToken,
        status: "waiting",
        myRole: "host",
        myParticipantId: result.hostParticipantId,
        participants: [
          {
            id: result.hostParticipantId,
            role: "host",
            joinedAt: Date.now(),
            isAudioActive: true,
            isVideoActive: true,
          },
        ],
        createdAt: Date.now(),
        soloExpiresAt: result.expiresAt,
      };

      setSession(newSession);
      setStatus("waiting");
      setRejoinSession(roomService.getRejoinSession());
    } catch (err: unknown) {
      const e = err as Error;
      setError({
        code: "NETWORK_ERROR",
        message: e.message || "Failed to create room",
      });
      setStatus("idle");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, token?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await roomService.joinRoom(roomId, token || "");
      const newSession: RoomSession = {
        roomId: result.roomId,
        inviteToken: token || "",
        status: result.status,
        myRole: result.role,
        myParticipantId: result.participantId,
        participants: result.participants,
        createdAt: Date.now(),
        soloExpiresAt: result.soloExpiresAt,
      };

      setSession(newSession);
      setStatus(result.status);
      setRejoinSession(roomService.getRejoinSession());
    } catch (err: unknown) {
      const roomErr = err as RoomError;
      setError(roomErr);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    if (session) {
      await roomService.leaveRoom(session.roomId, session.myParticipantId);
    }
    setSession(null);
    setStatus("idle");
    setRejoinSession(null);
    signalingService.disconnect();
  }, [session]);

  const rejoinLastRoom = useCallback(async () => {
    const cached = roomService.getRejoinSession();
    if (!cached) return;

    await joinRoom(cached.roomId, cached.inviteToken);
  }, [joinRoom]);

  // Dev simulation helpers: test 2nd participant join / leave
  const simulateSecondParticipantJoin = useCallback(() => {
    if (!session || session.participants.length >= 2) return;

    const guestParticipant: Participant = {
      id: "p_guest_preview",
      role: "guest",
      joinedAt: Date.now(),
      isAudioActive: true,
      isVideoActive: true,
    };

    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "active",
        soloExpiresAt: null, // Cancel countdown
        participants: [...prev.participants, guestParticipant],
      };
    });
    setStatus("active");
  }, [session]);

  const simulateSecondParticipantLeave = useCallback(() => {
    if (!session || session.participants.length < 2) return;

    const remaining = session.participants.slice(0, 1);
    const newExpiresAt = Date.now() + 30 * 60 * 1000;

    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "waiting",
        soloExpiresAt: newExpiresAt, // Restart countdown
        participants: remaining,
      };
    });
    setStatus("waiting");
  }, [session]);

  const inviteUrl = session
    ? buildInviteUrl(session.roomId, session.inviteToken)
    : "";

  return (
    <RoomContext.Provider
      value={{
        session,
        status,
        isLoading,
        error,
        inviteUrl,
        hasRejoinableSession: !!rejoinSession && !session,
        timeRemaining: computeTimeRemaining(),
        createRoom,
        joinRoom,
        leaveRoom,
        rejoinLastRoom,
        simulateSecondParticipantJoin,
        simulateSecondParticipantLeave,
        clearError: () => setError(null),
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = (): RoomContextValue => {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return ctx;
};
