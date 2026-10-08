import React from "react";
import {
  Sparkle,
  PlusCircle,
  SignIn,
  WindowsLogo,
  AndroidLogo,
  ShieldCheck,
  Clock,
  Users,
  LockKey,
} from "@phosphor-icons/react";

interface LandingHeroProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <section className="w-full pt-12 pb-16 sm:pt-20 sm:pb-24 text-center px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2b2d31] border border-[#35373c] text-[#dbdee1] text-xs font-semibold select-none">
          <Sparkle size={14} weight="fill" className="text-[#5865f2]" />
          <span>Lightweight • Temporary • 1-to-1 Voice, Video & Chat</span>
        </div>

        {/* Main Display Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#f2f3f5] tracking-tight leading-[1.15]">
            Direct 1-on-1 conversations. <br className="hidden sm:inline" />
            <span className="text-[#5865f2]">Ephemeral by design.</span>
          </h1>

          <p className="text-sm sm:text-lg text-[#949ba4] max-w-2xl mx-auto leading-relaxed pt-2">
            Create an instant room. Share the private link with one person. Connect directly over
            encrypted peer-to-peer audio, video, and vanishing chat. Zero accounts, zero tracking,
            and zero stored logs.
          </p>
        </div>

        {/* Primary CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={onCreateRoom}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:scale-[0.98] text-white text-sm sm:text-base font-semibold transition-all cursor-pointer min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]"
          >
            <PlusCircle size={20} weight="bold" />
            <span>Create Instant Room</span>
          </button>

          <button
            type="button"
            onClick={onJoinRoom}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] active:scale-[0.98] border border-[#35373c] text-[#f2f3f5] text-sm sm:text-base font-semibold transition-all cursor-pointer min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]"
          >
            <SignIn size={20} weight="bold" />
            <span>Join with Code / Link</span>
          </button>
        </div>

        {/* Platform Downloads Shortcut */}
        <div className="flex items-center justify-center gap-3 pt-3 flex-wrap text-xs text-[#949ba4]">
          <span className="text-[#80848e]">Also available as native apps:</span>
          <a
            href="https://github.com/carlodandan/KunekTayo/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-[#35373c] hover:text-[#f2f3f5] hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <WindowsLogo size={14} weight="fill" className="text-[#5865f2]" />
            <span>Windows (.exe / .msi)</span>
          </a>
          <a
            href="https://github.com/carlodandan/KunekTayo/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-[#35373c] hover:text-[#f2f3f5] hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <AndroidLogo size={14} weight="fill" className="text-[#23a55a]" />
            <span>Android (.apk)</span>
          </a>
        </div>

        {/* Core Invariants Trust Strip */}
        <div className="pt-8 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
          <div className="p-3.5 rounded-xl bg-[#2b2d31] border border-[#35373c]">
            <div className="flex items-center gap-2 text-[#5865f2] mb-1">
              <Users size={18} weight="bold" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">Strict 1-to-1</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#949ba4] leading-normal">
              Capped at 2 people. Third parties cannot join or eavesdrop.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#2b2d31] border border-[#35373c]">
            <div className="flex items-center gap-2 text-[#f0b232] mb-1">
              <Clock size={18} weight="bold" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">30m Expiration</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#949ba4] leading-normal">
              Solo rooms auto-delete if peer does not connect within 30 min.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#2b2d31] border border-[#35373c]">
            <div className="flex items-center gap-2 text-[#23a55a] mb-1">
              <LockKey size={18} weight="bold" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">Direct P2P</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#949ba4] leading-normal">
              WebRTC media streams directly between devices. Zero relay leaks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#2b2d31] border border-[#35373c]">
            <div className="flex items-center gap-2 text-[#5865f2] mb-1">
              <ShieldCheck size={18} weight="bold" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">Zero Footprint</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#949ba4] leading-normal">
              No accounts, no user profiles, and no server databases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
