/**
 * Application Constants
 */

export const APP_NAME = "KunekTayo";
export const APP_TAGLINE = "Temporary 1-on-1 private voice, video & chat";

export const ROOM_CONSTRAINTS = {
  MAX_PARTICIPANTS: 2,
  SOLO_EXPIRATION_MINUTES: 30,
  TOKEN_LENGTH: 16,
  RECONNECT_GRACE_PERIOD_SECONDS: 45,
} as const;

export const CHAT_CONSTRAINTS = {
  DEFAULT_TTL_SECONDS: 60,
  MIN_TTL_SECONDS: 10,
  MAX_TTL_SECONDS: 600, // 10 minutes max
  MAX_MESSAGE_LENGTH: 2000,
} as const;

export const PLATFORMS = {
  WINDOWS: "windows",
  ANDROID: "android",
  WEB: "web",
} as const;
