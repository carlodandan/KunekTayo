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
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { useChat, TTL_OPTIONS, EphemeralChatMessage } from "@/context/ChatContext";
import { useFileTransfer } from "@/context/FileTransferContext";
import { useRoom } from "@/context/RoomContext";
import { cn } from "@/utils/cn";

export const EphemeralChat: React.FC<{ className?: string }> = ({ className }) => {
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

  // Update clock every second for live TTL burn countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Trigger typing event with debounce
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    sendMessage(trimmed);
    setInputText("");
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
        "flex flex-col h-[400px] sm:h-[460px] bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-left",
        className
      )}
    >
      {/* Chat Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fire size={18} className="text-amber-400" weight="fill" />
          <h3 className="text-sm font-semibold text-slate-200">Ephemeral P2P Chat</h3>
        </div>

        {/* TTL Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">TTL:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            {TTL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedTtl(opt.value)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer",
                  selectedTtl === opt.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ephemeral Notice */}
      <div className="px-3.5 py-1.5 bg-amber-950/20 border-b border-amber-900/30 text-[11px] text-amber-300 flex items-center gap-1.5 select-none">
        <ShieldCheck size={14} className="shrink-0" />
        <span>Messages vanish locally on both devices once TTL expires. Zero server logging.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-1 select-none">
            <Clock size={28} className="text-slate-600" />
            <p className="text-xs">No active messages.</p>
            <p className="text-[11px] text-slate-600">Send a self-destructing message.</p>
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
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed break-words shadow-sm",
                    isMine
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60"
                  )}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Message Meta (TTL Burn + Timestamp + Delivery status) */}
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400 select-none">
                  <span>{timeStr}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-400 font-mono font-medium">
                    <Fire size={12} weight="fill" />
                    {remaining}s
                  </span>
                  {isMine && (
                    <span className="ml-0.5 text-blue-300" title={msg.status}>
                      {msg.status === "delivered" ? (
                        <CheckFat size={12} weight="fill" className="text-emerald-400" />
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
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pt-1">
            <DotsThree size={20} weight="bold" className="text-blue-400" />
            <span>Peer is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center gap-2"
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
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
          title="Share File / Image (Direct P2P)"
          aria-label="Share File"
        >
          <Paperclip size={18} weight="bold" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Type message (${selectedTtl}s auto-purge)...`}
          className="flex-1 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!inputText.trim()}
          icon={<PaperPlaneRight size={16} weight="bold" />}
          className="h-10 px-3.5 rounded-xl shrink-0 cursor-pointer"
        >
          Send
        </Button>
      </form>
    </div>
  );
};
