import React from "react";
import { Clock, Users, LockKey, WifiHigh } from "@phosphor-icons/react";
import { ROOM_CONSTRAINTS, CHAT_CONSTRAINTS } from "@/constants/app";

export const StatusBar: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#35373c] bg-[#1e1f22] px-4 py-2.5 sm:px-6 mt-auto select-none hidden sm:block">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#949ba4]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#dbdee1]">
            <LockKey size={14} className="text-[#5865f2]" weight="bold" />
            <span>End-to-end P2P Media</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-[#5865f2]" weight="bold" />
            <span>Max {ROOM_CONSTRAINTS.MAX_PARTICIPANTS} participants</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#f0b232]" weight="bold" />
            <span>{ROOM_CONSTRAINTS.SOLO_EXPIRATION_MINUTES}m solo room TTL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#949ba4]">
          <WifiHigh size={14} className="text-[#23a55a]" weight="bold" />
          <span>Chat TTL: {CHAT_CONSTRAINTS.DEFAULT_TTL_SECONDS}s</span>
        </div>
      </div>
    </footer>
  );
};
