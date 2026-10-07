/**
 * Application environment configuration
 * Validates and exposes environment variables with type safety and fallback defaults.
 */

export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly signalingUrl: string;
  readonly defaultStunServers: readonly string[];
  readonly turnServers: readonly RTCIceServer[];
  readonly roomSoloTimeoutMinutes: number;
  readonly messageDefaultTtlSeconds: number;
  readonly isDev: boolean;
}

function parseTurnServers(): RTCIceServer[] {
  const turnUrls = import.meta.env.VITE_TURN_SERVERS;
  if (!turnUrls) return [];

  const urls = turnUrls.split(",").map((s: string) => s.trim()).filter(Boolean);
  if (urls.length === 0) return [];

  const username = import.meta.env.VITE_TURN_USERNAME;
  const credential = import.meta.env.VITE_TURN_CREDENTIAL;

  return [
    {
      urls,
      username: username || undefined,
      credential: credential || undefined,
    },
  ];
}

export const env: AppConfig = {
  appName: "KunekTayo",
  appVersion: "0.1.0",
  signalingUrl:
    import.meta.env.VITE_SIGNALING_URL || "ws://localhost:8787/signaling",
  defaultStunServers: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
  ],
  turnServers: parseTurnServers(),
  roomSoloTimeoutMinutes: Number(
    import.meta.env.VITE_ROOM_SOLO_TIMEOUT_MINUTES || 30
  ),
  messageDefaultTtlSeconds: Number(
    import.meta.env.VITE_MESSAGE_DEFAULT_TTL_SECONDS || 60
  ),
  isDev: import.meta.env.DEV,
};
