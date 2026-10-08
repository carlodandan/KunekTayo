import React, { useState, useEffect } from "react";
import {
  VideoCamera,
  Microphone,
  ShieldCheck,
  ChatText,
  Fire,
  CheckFat,
  SignOut,
  ProjectorScreen,
  FileArrowUp,
  GearSix,
  Infinity as InfinityIcon,
  WifiHigh,
  ArrowsOut,
  Paperclip,
  PaperPlaneRight,
  User,
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#9098C8]">
            Product Preview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f2f3f5] tracking-tight">
            Minimal interface. Maximum presence.
          </h2>
          <p className="text-xs sm:text-sm text-[#949ba4] max-w-lg mx-auto">
            Everything you need for private communication without channels, servers, or clutter.
          </p>
        </div>

        {/* Mockup Container (Matches ActiveRoomView room layout) */}
        <div className="w-full rounded-2xl bg-[#1e1f22] border border-[#35373c] overflow-hidden shadow-2xl p-3 sm:p-5 space-y-3 sm:space-y-4">
          {/* Top Bar Status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 select-none">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1F332B] text-white border border-[#1F332B]">
                <WifiHigh size={14} weight="bold" />
                <span className="font-mono text-[11px]">18ms</span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold text-white/80">(excellent)</span>
              </div>
              <span className="text-xs text-[#949ba4] hidden sm:inline font-mono">
                Room #e8a93b48
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#949ba4]">
              <div className="flex items-center gap-1.5">
                <InfinityIcon size={15} className="text-[#9098C8]" weight="bold" />
                <span className="text-[11px] sm:text-xs font-medium text-[#dbdee1]">Active (2/2)</span>
              </div>

              <div
                className="p-1.5 rounded-lg text-[#949ba4] hover:text-[#f2f3f5] hover:bg-[#35373c] transition-colors cursor-pointer flex items-center justify-center min-h-[32px] min-w-[32px]"
                title="Fullscreen"
              >
                <ArrowsOut size={16} />
              </div>
            </div>
          </div>

          {/* Main Content Area (Video Stage + Ephemeral Chat) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            {/* Desktop Side-by-Side Split View */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Remote Participant Box */}
              <div className="relative w-full aspect-video bg-[#1e1f22] rounded-2xl overflow-hidden border border-[#35373c] flex items-center justify-center select-none min-h-[220px] sm:min-h-[260px] bg-gradient-to-br from-[#1e1f22] to-[#25282e]">
                {/* Status label top-left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="rounded-md bg-[#1e1f22]/90 font-medium text-[#f2f3f5] border border-[#35373c] text-xs px-2.5 py-1 shadow-sm">
                    Guest (Peer)
                  </span>
                </div>

                {/* Simulated live video stream display */}
                <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2b2d31] border border-[#35373c] flex items-center justify-center text-[#9098C8] shadow-inner">
                    <User size={36} weight="bold" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#9098C8] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#9098C8] animate-pulse" />
                    <span>Live 1080p • Direct P2P</span>
                  </div>
                </div>

                {/* Audio Status bottom-right */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="rounded-md bg-[#1e1f22]/90 text-[#9098C8] border border-[#35373c] text-[11px] font-mono px-2 py-0.5 flex items-center gap-1">
                    <Microphone size={12} weight="fill" />
                    <span>Opus HD</span>
                  </span>
                </div>
              </div>

              {/* Local Participant (You) */}
              <div className="relative w-full aspect-video bg-[#1e1f22] rounded-2xl overflow-hidden border border-[#35373c] flex items-center justify-center select-none min-h-[220px] sm:min-h-[260px] bg-gradient-to-br from-[#1e1f22] to-[#2b2d31]">
                {/* Status label top-left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="rounded-md bg-[#1e1f22]/90 font-medium text-[#f2f3f5] border border-[#35373c] text-xs px-2.5 py-1 shadow-sm">
                    You
                  </span>
                </div>

                {/* Simulated webcam video preview */}
                <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#949ba4] shadow-inner">
                    <User size={36} weight="bold" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#949ba4] font-medium">
                    <VideoCamera size={13} className="text-[#9098C8]" weight="fill" />
                    <span>Camera Active (Mirrored)</span>
                  </div>
                </div>

                {/* Audio Status bottom-right */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="rounded-md bg-[#1e1f22]/90 text-[#949ba4] border border-[#35373c] text-[11px] font-mono px-2 py-0.5 flex items-center gap-1">
                    <Microphone size={12} weight="fill" className="text-[#9098C8]" />
                    <span>Noise Filtered</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Ephemeral Chat Panel */}
            <div className="lg:col-span-1 flex flex-col h-full min-h-[340px] sm:min-h-[380px] bg-[#2b2d31] rounded-2xl border border-[#35373c] overflow-hidden shadow-lg select-none">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-[#35373c] flex items-center justify-between bg-[#232428]">
                <div className="flex items-center gap-2">
                  <Fire size={18} className="text-[#f0b232]" weight="fill" />
                  <h3 className="text-sm font-semibold text-[#f2f3f5]">Ephemeral Chat</h3>
                </div>

                {/* TTL Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#949ba4] font-medium">TTL:</span>
                  <div className="flex items-center bg-[#1e1f22] rounded-lg p-0.5 border border-[#35373c]">
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-[#949ba4]">30s</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#283E7C] text-white rounded-md">60s</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-[#949ba4]">5m</span>
                  </div>
                </div>
              </div>

              {/* Ephemeral Notice Banner */}
              <div className="px-3.5 py-1.5 bg-[#f0b232]/10 border-b border-[#f0b232]/20 text-[11px] text-[#f0b232] flex items-center gap-1.5">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="truncate">Messages vanish locally once TTL expires. Zero logging.</span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto flex flex-col justify-end">
                {/* Guest Message */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-xs bg-[#383a40] text-[#f2f3f5] border border-[#3f4147] px-3.5 py-2 text-xs leading-relaxed">
                    <p>Sent the document directly over P2P DataChannel. No servers touched it.</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-[#949ba4]">
                    <span>10:42 AM</span>
                    <span className="flex items-center gap-1 text-[#f0b232] font-mono">
                      <Fire size={11} weight="fill" />
                      <span>{countdown}s</span>
                    </span>
                  </div>
                </div>

                {/* You Message */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="max-w-[88%] rounded-2xl rounded-br-xs bg-[#283E7C] text-white px-3.5 py-2 text-xs leading-relaxed">
                    <p>Awesome. Once we leave the room, all keys and chat disappear forever.</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-[#949ba4]">
                    <span>10:43 AM</span>
                    <span className="text-[#9098C8] flex items-center">
                      <CheckFat size={11} weight="fill" />
                    </span>
                    <span className="flex items-center gap-1 text-[#f0b232] font-mono">
                      <Fire size={11} weight="fill" />
                      <span>54s</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-[#232428] border-t border-[#35373c] flex items-center gap-2">
                <div className="p-2 text-[#949ba4] hover:text-[#f2f3f5] rounded-xl hover:bg-[#35373c] transition-colors cursor-pointer">
                  <Paperclip size={18} />
                </div>
                <div className="flex-1 bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 py-2 text-xs text-[#949ba4] flex items-center justify-between">
                  <span>Type a vanishing message...</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#283E7C] flex items-center justify-center text-white cursor-pointer hover:bg-[#283E7C]/85 transition-colors">
                  <PaperPlaneRight size={15} weight="fill" />
                </div>
              </div>
            </div>
          </div>

          {/* In-Call Controls Floating Bar - Exact match to ActiveRoomView and app frontend */}
          <div className="p-2 sm:p-4 bg-[#2b2d31] border border-[#35373c] rounded-2xl flex items-center justify-between gap-1.5 sm:gap-3 shadow-lg select-none">
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center sm:justify-start">
              {/* Mic Toggle */}
              <button
                type="button"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-[#35373c] hover:bg-[#404249] text-[#f2f3f5] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Mute Microphone"
                aria-label="Mute Microphone"
              >
                <Microphone size={20} weight="bold" />
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-[#35373c] hover:bg-[#404249] text-[#f2f3f5] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Turn Off Camera"
                aria-label="Turn Off Camera"
              >
                <VideoCamera size={20} weight="bold" />
              </button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-[#35373c] hover:bg-[#404249] text-[#f2f3f5] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Share Screen"
                aria-label="Share Screen"
              >
                <ProjectorScreen size={20} weight="bold" />
              </button>

              {/* Ephemeral File Sharing Button */}
              <div className="relative">
                <button
                  type="button"
                  className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  title="P2P Shared Files (Drag & Drop)"
                  aria-label="P2P Shared Files"
                >
                  <FileArrowUp size={20} weight="bold" />
                </button>
                <span className="absolute -top-1 -right-1 bg-[#283E7C] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">
                  1
                </span>
              </div>

              {/* Ephemeral Chat Toggle */}
              <button
                type="button"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-[#35373c] hover:bg-[#404249] text-[#f2f3f5] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Ephemeral Chat"
                aria-label="Ephemeral Chat"
              >
                <ChatText size={20} weight="bold" />
              </button>

              {/* Device Settings Modal */}
              <button
                type="button"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 bg-transparent hover:bg-[#35373c] text-[#949ba4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Audio & Video Settings"
                aria-label="Device Settings"
              >
                <GearSix size={20} weight="bold" />
              </button>
            </div>

            {/* Leave Call */}
            <button
              type="button"
              className="rounded-full sm:rounded-xl min-h-[44px] min-w-[44px] w-11 h-11 sm:w-auto p-0 sm:px-4 bg-[#da373c] hover:bg-[#a1282c] text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Leave Call"
              aria-label="Leave Call"
            >
              <SignOut size={20} weight="bold" />
              <span className="hidden sm:inline">Leave Call</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
