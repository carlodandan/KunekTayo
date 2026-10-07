/**
 * Cryptographic utilities for room tokens and participant identification
 * Uses standard Web Crypto API (supported natively across modern web, Tauri, and Android WebView)
 */

/**
 * Generate a cryptographically random room identifier (16 hex characters)
 */
export function generateRoomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a cryptographically secure invite token (32 hex characters / 128-bit entropy)
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate an ephemeral participant identifier
 */
export function generateParticipantId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return "p_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute SHA-256 hash of a string using subtle crypto
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string equality comparison to resist side-channel timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Construct a standardized invite URL
 */
export function buildInviteUrl(roomId: string, token: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/#room=${roomId}&token=${token}`;
  }
  return `https://kunektayo.app/#room=${roomId}&token=${token}`;
}

/**
 * Parse a room ID and optional token from a URL string or raw input
 */
export function parseInviteInput(input: string): { roomId: string; token?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    // Check if it's a full URL
    if (trimmed.includes("http://") || trimmed.includes("https://") || trimmed.includes("#")) {
      const hashIndex = trimmed.indexOf("#");
      const queryIndex = trimmed.indexOf("?");
      
      let paramsString = "";
      if (hashIndex !== -1) {
        paramsString = trimmed.substring(hashIndex + 1);
      } else if (queryIndex !== -1) {
        paramsString = trimmed.substring(queryIndex + 1);
      }

      if (paramsString) {
        const searchParams = new URLSearchParams(paramsString);
        const roomId = searchParams.get("room");
        const token = searchParams.get("token");
        if (roomId) {
          return { roomId, token: token || undefined };
        }
      }
    }
  } catch {
    // Fall back to regex/token extraction
  }

  // Handle direct slash formatted URL (e.g., https://kunektayo.app/join/abc12345)
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length >= 6) {
      return { roomId: lastPart };
    }
  }

  // Treat as raw room code if valid length
  if (trimmed.length >= 6) {
    return { roomId: trimmed };
  }

  return null;
}
