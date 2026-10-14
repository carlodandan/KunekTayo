import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { webrtcService } from "@/services/webrtcService";
import { signalingService } from "@/services/signalingService";
import { useRoom } from "./RoomContext";

export interface EphemeralChatMessage {
  readonly id: string;
  readonly senderId: string;
  readonly senderRole: "host" | "guest";
  readonly text: string;
  readonly timestamp: number;
  readonly ttlSeconds: number; // 0 means stays as long as 1 person is in room
  readonly expiresAt: number | null; // null means no expiration timer while in room
  status: "sending" | "delivered";
}

interface ChatContextValue {
  messages: EphemeralChatMessage[];
  isPeerTyping: boolean;
  selectedTtl: number;
  setSelectedTtl: (ttl: number) => void;
  sendMessage: (text: string) => void;
  sendTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const TTL_OPTIONS = [
  { label: "Room", value: 0 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
] as const;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status: roomStatus } = useRoom();
  const [messages, setMessages] = useState<EphemeralChatMessage[]>([]);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [selectedTtl, setSelectedTtl] = useState(0); // Default: stays as long as 1 person is inside
  const lastRoomIdRef = useRef<string | null>(null);

  // Load cached messages from tab sessionStorage on room entry
  useEffect(() => {
    if (session?.roomId) lastRoomIdRef.current = session.roomId;
    if (!session?.roomId || typeof window === "undefined" || !window.sessionStorage) return;
    try {
      const cached = sessionStorage.getItem(`kunektayo_chat_${session.roomId}`);
      if (cached) {
        const parsed = JSON.parse(cached) as EphemeralChatMessage[];
        const now = Date.now();
        const valid = parsed.filter((m) => !m.expiresAt || m.expiresAt > now);
        if (valid.length > 0) {
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            for (const msg of valid) {
              if (!map.has(msg.id)) {
                map.set(msg.id, msg);
              }
            }
            return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
          });
        }
      }
    } catch {
      // Storage restricted
    }
  }, [session?.roomId]);

  // Persist messages to tab sessionStorage while in room
  useEffect(() => {
    if (!session?.roomId || typeof window === "undefined" || !window.sessionStorage) return;
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(`kunektayo_chat_${session.roomId}`, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(`kunektayo_chat_${session.roomId}`);
      }
    } catch {
      // Storage restricted
    }
  }, [messages, session?.roomId]);

  // Periodic cleaner: Purges messages that have an explicit TTL once expired
  useEffect(() => {
    const cleaner = setInterval(() => {
      const now = Date.now();
      setMessages((prev) =>
        prev.filter((msg) => !msg.expiresAt || msg.expiresAt > now)
      );
    }, 1000);

    return () => clearInterval(cleaner);
  }, []);

  // Handle incoming DataChannel messages & fallback messages
  useEffect(() => {
    const handleIncoming = (payload: any) => {
      if (!payload) return;

      if (payload.type === "chat_msg" && payload.message) {
        const msg = payload.message as EphemeralChatMessage;
        // Verify not duplicate and not already expired (if expiresAt is set)
        if (!msg.expiresAt || msg.expiresAt > Date.now()) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, status: "delivered" }];
          });

          // Send delivery acknowledgement
          webrtcService.sendDataChannelMessage({
            type: "chat_ack",
            messageId: msg.id,
          });
        }
      }

      // Handle chat synchronization from peer
      if (payload.type === "chat_sync" && Array.isArray(payload.messages)) {
        const incomingList = payload.messages as EphemeralChatMessage[];
        const now = Date.now();
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          for (const msg of incomingList) {
            if (!msg.expiresAt || msg.expiresAt > now) {
              if (!map.has(msg.id)) {
                map.set(msg.id, { ...msg, status: "delivered" });
              }
            }
          }
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
      }

      if (payload.type === "chat_ack" && payload.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId ? { ...m, status: "delivered" } : m
          )
        );
      }

      if (payload.type === "typing_state") {
        setIsPeerTyping(!!payload.isTyping);
      }
    };

    const unsubDc = webrtcService.on("datachannel_message", handleIncoming);
    const unsubFallback = signalingService.on("datachannel_fallback", handleIncoming);

    return () => {
      unsubDc();
      unsubFallback();
    };
  }, []);

  // Synchronize chat history with peer whenever DataChannel opens or peer connects
  useEffect(() => {
    const handleSync = () => {
      setMessages((current) => {
        const activeList = current.filter((m) => !m.expiresAt || m.expiresAt > Date.now());
        if (activeList.length > 0) {
          webrtcService.sendDataChannelMessage({
            type: "chat_sync",
            messages: activeList,
          });
        }
        return current;
      });
    };

    const unsubDcState = webrtcService.on("datachannel_state", (state: string) => {
      if (state === "open") {
        handleSync();
      }
    });

    const unsubPeerReady = signalingService.on("peer_ready", () => {
      setTimeout(handleSync, 1000);
    });

    return () => {
      unsubDcState();
      unsubPeerReady();
    };
  }, []);

  // Clear messages when leaving or room closed
  useEffect(() => {
    if (roomStatus !== "active" && roomStatus !== "waiting") {
      setMessages([]);
      setIsPeerTyping(false);
      const roomId = session?.roomId ?? lastRoomIdRef.current;
      if (roomId && typeof window !== "undefined" && window.sessionStorage) {
        try {
          sessionStorage.removeItem(`kunektayo_chat_${roomId}`);
        } catch {}
      }
      lastRoomIdRef.current = null;
    }
  }, [roomStatus, session?.roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !session) return;

      const now = Date.now();
      const expiresAt = selectedTtl > 0 ? now + selectedTtl * 1000 : null;

      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      const id = "msg_" + Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      const newMsg: EphemeralChatMessage = {
        id,
        senderId: session.myParticipantId,
        senderRole: session.myRole,
        text: trimmed,
        timestamp: now,
        ttlSeconds: selectedTtl,
        expiresAt,
        status: "sending",
      };

      setMessages((prev) => [...prev, newMsg]);

      // Transmit over WebRTC DataChannel
      webrtcService.sendDataChannelMessage({
        type: "chat_msg",
        message: newMsg,
      });
    },
    [session, selectedTtl]
  );

  const sendTyping = useCallback((isTyping: boolean) => {
    webrtcService.sendDataChannelMessage({
      type: "typing_state",
      isTyping,
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isPeerTyping,
        selectedTtl,
        setSelectedTtl,
        sendMessage,
        sendTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
};
