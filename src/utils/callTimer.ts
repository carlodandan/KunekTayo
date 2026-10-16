/**
 * Call timer formatting and resolution utilities for KunekTayo
 */

/**
 * Format total elapsed seconds into MM:SS or HH:MM:SS
 */
export function formatCallDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Resolve the call start timestamp.
 * When 2 participants are in the room, the call started when the 2nd joined.
 * Caches in sessionStorage per room to survive page reloads and brief reconnects.
 */
export function resolveCallStartedAt(
  participants?: readonly { joinedAt: number }[],
  roomId?: string
): number | null {
  const storageKey = roomId ? `kunektayo_call_started_${roomId}` : null;

  if (typeof sessionStorage !== "undefined" && storageKey) {
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const parsed = parseInt(cached, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // Storage access may fail in sandboxed or private environments
    }
  }

  if (!participants || participants.length < 2) return null;

  // When 2 participants are present, call started when the 2nd participant arrived
  const startTime = Math.max(...participants.map((p) => p.joinedAt));

  if (typeof sessionStorage !== "undefined" && storageKey) {
    try {
      sessionStorage.setItem(storageKey, String(startTime));
    } catch {
      // Storage write error ignored
    }
  }

  return startTime;
}

/**
 * Clear cached call start timestamp when call terminates
 */
export function clearCallStartedAt(roomId?: string): void {
  if (typeof sessionStorage !== "undefined" && roomId) {
    try {
      sessionStorage.removeItem(`kunektayo_call_started_${roomId}`);
    } catch {
      // Storage access error ignored
    }
  }
}
