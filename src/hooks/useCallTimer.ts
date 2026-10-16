import { useState, useEffect } from "react";
import { formatCallDuration, resolveCallStartedAt } from "@/utils/callTimer";

export interface UseCallTimerOptions {
  startTime?: number | null;
  participants?: readonly { joinedAt: number }[];
  roomId?: string;
  isActive?: boolean;
}

export interface UseCallTimerResult {
  elapsedSeconds: number;
  formattedDuration: string;
  hours: number;
  minutes: number;
  seconds: number;
  startTime: number | null;
}

/**
 * Dynamic call duration timer hook
 * Updates every second while the call is active.
 */
export function useCallTimer({
  startTime: explicitStartTime,
  participants,
  roomId,
  isActive = true,
}: UseCallTimerOptions = {}): UseCallTimerResult {
  const [now, setNow] = useState(() => Date.now());
  const [resolvedStartTime, setResolvedStartTime] = useState<number | null>(() => {
    if (!isActive) return null;
    if (explicitStartTime) return explicitStartTime;
    return resolveCallStartedAt(participants, roomId);
  });

  // Keep start time resolved when participants or roomId change
  useEffect(() => {
    if (!isActive) {
      setResolvedStartTime(null);
      return;
    }
    if (explicitStartTime) {
      setResolvedStartTime(explicitStartTime);
      return;
    }
    setResolvedStartTime((prev) => prev || resolveCallStartedAt(participants, roomId));
  }, [isActive, explicitStartTime, participants, roomId]);

  // Interval timer updating every second
  useEffect(() => {
    if (!isActive || !resolvedStartTime) return;

    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, resolvedStartTime]);

  const elapsedSeconds =
    isActive && resolvedStartTime
      ? Math.max(0, Math.floor((now - resolvedStartTime) / 1000))
      : 0;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedDuration = formatCallDuration(elapsedSeconds);

  return {
    elapsedSeconds,
    formattedDuration,
    hours,
    minutes,
    seconds,
    startTime: resolvedStartTime,
  };
}
