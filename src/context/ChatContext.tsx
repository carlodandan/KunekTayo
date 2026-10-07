import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { webrtcService } from "@/services/webrtcService";
import { signalingService } from "@/services/signalingService";
import { useRoom } from "./RoomContext";

export interface EphemeralChatMessage {
  readonly id: string;
  readonly senderId: string;
  readonly senderRole: "host" | "guest";
  readonly text: string;
  readonly timestamp: number;
  readonly ttlSeconds: number;
  readonly expiresAt: number;
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
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
] as const;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status: roomStatus } = useRoom();
  const [messages, setMessages] = useState<EphemeralChatMessage[]>([]);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [selectedTtl, setSelectedTtl] = useState(60);

  // Periodic cleaner: Purges messages that have exceeded their TTL
  useEffect(() => {
    const cleaner = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((msg) => msg.expiresAt > now));
    }, 1000);

    return () => clearInterval(cleaner);
  }, []);

  // Handle incoming DataChannel messages & fallback messages
  useEffect(() => {
    const handleIncoming = (payload: any) => {
      if (!payload) return;

      if (payload.type === "chat_msg" && payload.message) {
        const msg = payload.message as EphemeralChatMessage;
        // Verify not duplicate and not already expired
        if (msg.expiresAt > Date.now()) {
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

  // Clear messages when leaving the room
  useEffect(() => {
    if (roomStatus !== "active" && roomStatus !== "waiting") {
      setMessages([]);
      setIsPeerTyping(false);
    }
  }, [roomStatus]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !session) return;

      const now = Date.now();
      const expiresAt = now + selectedTtl * 1000;

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
