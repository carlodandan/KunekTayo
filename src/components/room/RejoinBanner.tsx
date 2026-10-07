import React, { useState } from "react";
import { ArrowClockwise, X, PlugsConnected } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { useRoom } from "@/context/RoomContext";
import { roomService } from "@/services/roomService";

export const RejoinBanner: React.FC = () => {
  const { hasRejoinableSession, rejoinLastRoom } = useRoom();
  const [dismissed, setDismissed] = useState(false);
  const cached = roomService.getRejoinSession();

  if (!hasRejoinableSession || dismissed || !cached) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    roomService.clearRejoinSession();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
          <PlugsConnected size={18} weight="bold" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-white">
            Active session detected (Room #{cached.roomId.substring(0, 8)})
          </p>
          <p className="text-[11px] text-slate-400">
            Rejoin your recent room session as {cached.role}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <Button
          variant="primary"
          size="sm"
          onClick={rejoinLastRoom}
          icon={<ArrowClockwise size={14} weight="bold" />}
        >
          Rejoin
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss rejoin prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
