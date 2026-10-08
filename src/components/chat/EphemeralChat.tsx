import React, { useState, useEffect, useRef } from "react";
import {
  PaperPlaneRight,
  Clock,
  Fire,
  Check,
  CheckFat,
  DotsThree,
  ShieldCheck,
  Paperclip,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { useChat, TTL_OPTIONS, EphemeralChatMessage } from "@/context/ChatContext";
import { useFileTransfer } from "@/context/FileTransferContext";
import { useRoom } from "@/context/RoomContext";
import { cn } from "@/utils/cn";

export const EphemeralChat: React.FC<{ className?: string; onClose?: () => void }> = ({
  className,
  onClose,
}) => {
  const { session } = useRoom();
  const {
    messages,
    isPeerTyping,
    selectedTtl,
    setSelectedTtl,
    sendMessage,
    sendTyping,
  } = useChat();
  const { sendFile } = useFileTransfer();

  const [inputText, setInputText] = useState("");
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update clock every second for live TTL burn countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    adjustTextareaHeight();

    // Trigger typing event with debounce
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    sendMessage(trimmed);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      const res = await sendFile(file);
      if (res) {
        sendMessage(`📎 Shared file: ${file.name}`);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getRemainingSecs = (msg: EphemeralChatMessage) => {
    const diff = Math.max(0, Math.ceil((msg.expiresAt - now) / 1000));
    return diff;
  };

  return (
    <div
      className={cn(
        "flex flex-col h-[400px] sm:h-[460px] bg-[#2b2d31] rounded-2xl border border-[#35373c] overflow-hidden text-left",
        className
      )}
    >
      {/* Chat Header */}
      <div className="p-3.5 border-b border-[#35373c] bg-[#1e1f22] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 text-[#949ba4] hover:text-[#f2f3f5] rounded-lg hover:bg-[#35373c] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X size={16} weight="bold" />
            </button>
          )}
          <Fire size={18} className="text-[#f0b232]" weight="fill" />
          <h3 className="text-sm font-semibold text-[#f2f3f5]">Ephemeral Chat</h3>
        </div>

        {/* TTL Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#949ba4] font-medium">TTL:</span>
          <div className="flex items-center bg-[#2b2d31] rounded-lg p-0.5 border border-[#35373c]">
            {TTL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedTtl(opt.value)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer",
                  selectedTtl === opt.value
                    ? "bg-[#5865f2] text-white"
                    : "text-[#949ba4] hover:text-[#f2f3f5]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ephemeral Notice */}
      <div className="px-3.5 py-1.5 bg-[#f0b232]/10 border-b border-[#f0b232]/20 text-[11px] text-[#f0b232] flex items-center gap-1.5 select-none">
        <ShieldCheck size={14} className="shrink-0" />
        <span>Messages vanish locally on both devices once TTL expires. Zero server logging.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#80848e] space-y-1 select-none">
            <Clock size={28} className="text-[#80848e]" />
            <p className="text-xs">No active messages.</p>
            <p className="text-[11px] text-[#80848e]">Send a self-destructing message.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === session?.myParticipantId;
            const remaining = getRemainingSecs(msg);
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={cn("flex flex-col space-y-1 animate-in fade-in duration-150", isMine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed break-words",
                    isMine
                      ? "bg-[#5865f2] text-white rounded-br-xs"
                      : "bg-[#383a40] text-[#f2f3f5] rounded-bl-xs border border-[#3f4147]"
                  )}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Message Meta (TTL Burn + Timestamp + Delivery status) */}
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-[#949ba4] select-none">
                  <span>{timeStr}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-[#f0b232] font-mono font-medium">
                    <Fire size={12} weight="fill" />
                    {remaining}s
                  </span>
                  {isMine && (
                    <span className="ml-0.5 text-[#dbdee1]" title={msg.status}>
                      {msg.status === "delivered" ? (
                        <CheckFat size={12} weight="fill" className="text-[#23a55a]" />
                      ) : (
                        <Check size={12} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Peer Typing Indicator */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 text-xs text-[#949ba4] animate-pulse pt-1">
            <DotsThree size={20} weight="bold" className="text-[#5865f2]" />
            <span>Peer is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#35373c] bg-[#1e1f22] flex items-end gap-2 w-full max-w-full"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-[#949ba4] hover:text-[#f2f3f5] rounded-xl hover:bg-[#35373c] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 mb-0.5"
          title="Share File / Image (Direct P2P)"
          aria-label="Share File"
        >
          <Paperclip size={18} weight="bold" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Type message (${selectedTtl}s auto-purge)...`}
          className="flex-1 min-w-0 bg-[#383a40] text-[#f2f3f5] placeholder:text-[#80848e] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border border-[#3f4147] focus:border-[#5865f2] focus:outline-none transition-colors resize-none overflow-y-auto max-h-28 leading-snug"
        />

        <div className="shrink-0 flex items-center">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim()}
            icon={<PaperPlaneRight size={16} weight="bold" />}
            className="h-10 min-h-[40px] min-w-[40px] sm:min-w-[76px] px-3.5 rounded-xl shrink-0 cursor-pointer flex items-center justify-center mb-0.5"
          >
            <span>Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
