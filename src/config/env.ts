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

function getSignalingUrl(): string {
  // In a web browser environment, always prioritize same-origin Service Binding proxy
  // to avoid CORS errors and prevent exposing backend worker URLs.
  if (typeof window !== "undefined" && window.location && window.location.host) {
    const host = window.location.host;
    const isLocalVite = host.includes("localhost:1420") || host.includes("127.0.0.1:1420");
    const isTauriEnv = !!((window as any).__TAURI_INTERNALS__ || (window as any).isTauri);

    if (!isLocalVite && !isTauriEnv) {
      const isHttps = window.location.protocol === "https:";
      const protocol = isHttps ? "wss:" : "ws:";
      return `${protocol}//${host}`;
    }
  }

  const envUrl = import.meta.env.VITE_SIGNALING_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }

  // Fallback for native Tauri app (Windows / Android) when VITE_SIGNALING_URL is omitted:
  // Points to the live Cloudflare Pages Service Binding endpoint
  return "wss://kunektayo.pages.dev";
}

export const env: AppConfig = {
  appName: "KunekTayo",
  appVersion: "0.1.0",
  signalingUrl: getSignalingUrl(),
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