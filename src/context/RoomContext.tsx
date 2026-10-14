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
  joinRoom: (roomId: string, token?: string, participantId?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  rejoinLastRoom: () => Promise<void>;
  simulateSecondParticipantJoin: () => void;
  simulateSecondParticipantLeave: () => void;
  clearError: () => void;
  isPeerReconnecting: boolean;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<RoomSession | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RoomError | null>(null);
  const [rejoinSession, setRejoinSession] = useState<RejoinSession | null>(null);
  const [isPeerReconnecting, setIsPeerReconnecting] = useState(false);

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
    return () => notifyNativeCallState(false);
  }, [status]);

  // Connect signaling whenever active session changes
  useEffect(() => {
    if (!session) {
      signalingService.disconnect();
      setIsPeerReconnecting(false);
      return;
    }

    signalingService.connect(session.roomId, session.inviteToken, session.myParticipantId);

    const unsubState = signalingService.on("room_state", (payload: any) => {
      if (payload.state) {
        setStatus(payload.state);
        if (payload.state === "active") {
          setIsPeerReconnecting(false);
        }
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: payload.state,
            soloExpiresAt: null, // Room has no expiration timer; stays active while host is inside
            participants: payload.participants || prev.participants,
          };
        });
      }
    });

    const unsubPeerJoined = signalingService.on("peer_ready", () => {
      setStatus("active");
      setIsPeerReconnecting(false);
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "active",
          soloExpiresAt: null,
        };
      });
    });

    const unsubPeerStatus = signalingService.on("peer_connection_status", (payload: any) => {
      if (payload.status === "disconnected") {
        setIsPeerReconnecting(true);
      } else if (payload.status === "connected") {
        setIsPeerReconnecting(false);
      }
    });

    const unsubPeerLeft = signalingService.on("peer_left", () => {
      setIsPeerReconnecting(false);
    });

    return () => {
      unsubState();
      unsubPeerJoined();
      unsubPeerStatus();
      unsubPeerLeft();
    };
  }, [session?.roomId, session?.inviteToken, session?.myParticipantId]);

  // Rooms have no expiration countdown; life cycle depends on the host
  const computeTimeRemaining = () => null;

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

  const joinRoom = useCallback(async (roomId: string, token?: string, participantId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await roomService.joinRoom(roomId, token || "", participantId);
      const newSession: RoomSession = {
        roomId: result.roomId,
        inviteToken: token || "",
        status: result.status,
        myRole: result.role,
        myParticipantId: result.participantId,
        participants: result.participants,
        createdAt: Date.now(),
        soloExpiresAt: null,
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
    setIsPeerReconnecting(false);
    signalingService.disconnect();
  }, [session]);

  const rejoinLastRoom = useCallback(async () => {
    const cached = roomService.getRejoinSession();
    if (!cached) return;

    await joinRoom(cached.roomId, cached.inviteToken, cached.participantId);
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

    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "waiting",
        soloExpiresAt: null, // Room stays open as long as one person is inside
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
        isPeerReconnecting,
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
