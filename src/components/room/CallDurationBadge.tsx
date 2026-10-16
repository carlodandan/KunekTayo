import React from "react";
import { useRoom } from "@/context/RoomContext";
import { useCallTimer } from "@/hooks/useCallTimer";
import { cn } from "@/utils/cn";

export interface CallDurationBadgeProps {
  className?: string;
  startTime?: number | null;
}

export const CallDurationBadge: React.FC<CallDurationBadgeProps> = ({
  className,
  startTime: explicitStartTime,
}) => {
  const { session, status } = useRoom();

  const isCallActive = status === "active";
  const { formattedDuration } = useCallTimer({
    startTime: explicitStartTime,
    participants: session?.participants,
    roomId: session?.roomId,
    isActive: isCallActive,
  });

  if (!isCallActive) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none whitespace-nowrap border transition-colors",
        "bg-[#1e1f22] text-[#dbdee1] border-[#35373c]",
        className
      )}
      title={`Call Duration: ${formattedDuration}`}
      aria-label={`Call duration: ${formattedDuration}`}
    >
      <span className="font-mono text-[11px] tabular-nums font-semibold text-[#f2f3f5]">
        {formattedDuration}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#9098C8] shrink-0 animate-pulse"
        title="Live Call"
      />
    </div>
  );
};
