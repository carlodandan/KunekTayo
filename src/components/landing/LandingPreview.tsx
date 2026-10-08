import React, { useState, useEffect } from "react";
import {
  VideoCamera,
  Microphone,
  ShieldCheck,
  Clock,
  ChatText,
  Fire,
  CheckCircle,
  PhoneDisconnect,
  Broadcast,
  Paperclip,
} from "@phosphor-icons/react";

export const LandingPreview: React.FC = () => {
  // Simulated countdown for the interactive preview message
  const [countdown, setCountdown] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full py-8 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5865f2]">
            Product Preview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f2f3f5] tracking-tight">
            Minimal interface. Maximum presence.
          </h2>
          <p className="text-xs sm:text-sm text-[#949ba4] max-w-lg mx-auto">
            Everything you need for private communication without channels, servers, or clutter.
          </p>
        </div>

        {/* Mockup Container */}
        <div className="w-full rounded-2xl bg-[#2b2d31] border border-[#35373c] overflow-hidden shadow-2xl">
          {/* Mock Window Titlebar */}
          <div className="w-full h-10 bg-[#1e1f22] border-b border-[#35373c] px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#da373c]/80" />
              <div className="w-3 h-3 rounded-full bg-[#f0b232]/80" />
              <div className="w-3 h-3 rounded-full bg-[#23a55a]/80" />
              <span className="text-xs text-[#949ba4] font-medium ml-2 hidden sm:inline">
                KunekTayo — Room #e8a93b48
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2b2d31] border border-[#35373c] text-[#23a55a] font-medium text-[11px]">
                <Broadcast size={12} weight="bold" />
                <span>P2P Active (14ms)</span>
              </span>
              <span className="flex items-center gap-1 text-[#5865f2] font-medium text-[11px] hidden xs:flex">
                <ShieldCheck size={14} weight="fill" />
                <span>DTLS-SRTP Encrypted</span>
              </span>
            </div>
          </div>

          {/* Mock Stage Grid */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-[#1e1f22]/60">
            {/* Video Stage (2 Cols on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[260px] sm:min-h-[300px]">
                {/* Host Video Box */}
                <div className="rounded-xl bg-[#2b2d31] border border-[#35373c] p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded bg-[#1e1f22]/80 border border-[#35373c] text-[11px] text-[#dbdee1] font-semibold">
                      You (Host)
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a]" />
                  </div>

                  <div className="my-auto flex flex-col items-center justify-center text-center space-y-2 py-8">
                    <div className="w-16 h-16 rounded-full bg-[#35373c] border border-[#404249] flex items-center justify-center text-[#5865f2]">
                      <VideoCamera size={28} weight="fill" />
                    </div>
                    <span className="text-xs text-[#949ba4]">Camera Active • 1080p HD</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#949ba4] z-10">
                    <span className="flex items-center gap-1 text-[#23a55a]">
                      <Microphone size={12} weight="fill" />
                      <span>Audio Input On</span>
                    </span>
                    <span className="font-mono text-[10px]">VP8 / Opus</span>
                  </div>
                </div>

                {/* Remote Participant Box */}
                <div className="rounded-xl bg-[#2b2d31] border border-[#35373c] p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded bg-[#1e1f22]/80 border border-[#35373c] text-[11px] text-[#dbdee1] font-semibold">
                      Guest (Participant 2)
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a]" />
                  </div>

                  <div className="my-auto flex flex-col items-center justify-center text-center space-y-2 py-8">
                    <div className="w-16 h-16 rounded-full bg-[#35373c] border border-[#404249] flex items-center justify-center text-[#23a55a]">
                      <Broadcast size={28} weight="bold" />
                    </div>
                    <span className="text-xs text-[#949ba4]">Connected directly • Direct Peer</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#949ba4] z-10">
                    <span className="flex items-center gap-1 text-[#23a55a]">
                      <CheckCircle size={12} weight="fill" />
                      <span>Zero Packet Loss</span>
                    </span>
                    <span className="font-mono text-[10px]">Direct P2P</span>
                  </div>
                </div>
              </div>

              {/* Mock Call Control Dock */}
              <div className="p-2.5 rounded-xl bg-[#2b2d31] border border-[#35373c] flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <div className="p-2.5 rounded-lg bg-[#35373c] text-[#f2f3f5] text-xs flex items-center gap-1.5 font-medium">
                  <Microphone size={16} weight="bold" />
                  <span className="hidden sm:inline">Mute</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#35373c] text-[#f2f3f5] text-xs flex items-center gap-1.5 font-medium">
                  <VideoCamera size={16} weight="bold" />
                  <span className="hidden sm:inline">Camera</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#35373c] text-[#f2f3f5] text-xs flex items-center gap-1.5 font-medium">
                  <Paperclip size={16} weight="bold" />
                  <span className="hidden sm:inline">Send File</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#5865f2] text-white text-xs flex items-center gap-1.5 font-semibold">
                  <ChatText size={16} weight="bold" />
                  <span>Chat (Live)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#da373c] text-white text-xs flex items-center gap-1.5 font-semibold">
                  <PhoneDisconnect size={16} weight="bold" />
                  <span>Leave</span>
                </div>
              </div>
            </div>

            {/* Mock Ephemeral Chat Sidebar */}
            <div className="rounded-xl bg-[#2b2d31] border border-[#35373c] p-4 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#35373c]">
                  <div className="flex items-center gap-2">
                    <ChatText size={16} className="text-[#5865f2]" weight="bold" />
                    <span className="text-xs font-bold text-[#f2f3f5]">Ephemeral Chat</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-[#f0b232] font-mono">
                    <Fire size={13} weight="fill" />
                    <span>TTL: 60s</span>
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  {/* Message 1 */}
                  <div className="p-2.5 rounded-lg bg-[#1e1f22] border border-[#35373c] text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#949ba4]">
                      <span className="font-semibold text-[#dbdee1]">Guest</span>
                      <span className="flex items-center gap-1 text-[#f0b232] font-mono">
                        <Clock size={11} />
                        <span>Vanishes in {countdown}s</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#f2f3f5]">
                      Sent the file over P2P DataChannel. No servers touched it.
                    </p>
                  </div>

                  {/* Message 2 (You) */}
                  <div className="p-2.5 rounded-lg bg-[#35373c]/50 border border-[#35373c] text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#949ba4]">
                      <span className="font-semibold text-[#5865f2]">You</span>
                      <span className="text-[#23a55a] text-[10px]">Delivered</span>
                    </div>
                    <p className="text-xs text-[#f2f3f5]">
                      Awesome. Once we disconnect, this entire room disappears.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Input Placeholder */}
              <div className="pt-3">
                <div className="p-2 rounded-lg bg-[#1e1f22] border border-[#35373c] flex items-center justify-between text-xs text-[#949ba4]">
                  <span>Type a vanishing message...</span>
                  <div className="w-6 h-6 rounded bg-[#5865f2] flex items-center justify-center text-white text-[10px] font-bold">
                    ↵
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
