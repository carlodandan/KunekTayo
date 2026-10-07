/**
 * Deep Link and Web Invite URL Service
 * Handles web invite parameters, Android App Links, and Windows deep link protocol schemes
 */

export interface DeepLinkPayload {
  roomId: string;
  token?: string;
  rawUrl: string;
}

export type DeepLinkListener = (payload: DeepLinkPayload) => void;

class DeepLinkService {
  private listeners = new Set<DeepLinkListener>();

  constructor() {
    this.initBrowserListener();
  }

  onDeepLink(listener: DeepLinkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(payload: DeepLinkPayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("Deep link listener error:", err);
      }
    });
  }

  buildDeepLink(roomId: string, token?: string): string {
    return token
      ? `kunektayo://join?room=${roomId}&token=${token}`
      : `kunektayo://join?room=${roomId}`;
  }

  buildWebInviteUrl(roomId: string, token?: string): string {
    return token
      ? `https://kunektayo.app/#room=${roomId}&token=${token}`
      : `https://kunektayo.app/#room=${roomId}`;
  }

  parseInviteTarget(urlStr: string): DeepLinkPayload | null {
    return this.parseUrl(urlStr);
  }

  /**
   * Parse deep link or invite URL
   */
  parseUrl(urlStr: string): DeepLinkPayload | null {
    if (!urlStr || !urlStr.trim()) return null;

    try {
      // Handle custom scheme kunektayo://join?room=...&token=...
      if (urlStr.startsWith("kunektayo://")) {
        const queryPart = urlStr.includes("?") ? urlStr.split("?")[1] : "";
        const params = new URLSearchParams(queryPart);
        const roomId = params.get("room") || params.get("roomId") || params.get("id");
        const token = params.get("token");
        if (roomId) {
          return { roomId, token: token || undefined, rawUrl: urlStr };
        }
      }

      // Handle standard web URLs
      if (urlStr.includes("#room=") || urlStr.includes("?room=")) {
        const hashIdx = urlStr.indexOf("#");
        const queryIdx = urlStr.indexOf("?");
        const paramsStr = hashIdx !== -1 ? urlStr.substring(hashIdx + 1) : urlStr.substring(queryIdx + 1);
        const params = new URLSearchParams(paramsStr);
        const roomId = params.get("room");
        const token = params.get("token");
        if (roomId) {
          return { roomId, token: token || undefined, rawUrl: urlStr };
        }
      }

      // Handle path format /join/:roomId
      if (urlStr.includes("/join/")) {
        const match = urlStr.match(/\/join\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          const roomId = match[1];
          const hashIdx = urlStr.indexOf("#token=");
          const token = hashIdx !== -1 ? urlStr.substring(hashIdx + 7).split("&")[0] : undefined;
          return { roomId, token, rawUrl: urlStr };
        }
      }
    } catch {
      // Ignore parse failure
    }

    return null;
  }

  /**
   * Check browser location for invite parameters on launch
   */
  checkInitialUrl(): DeepLinkPayload | null {
    if (typeof window === "undefined" || !window.location) return null;
    return this.parseUrl(window.location.href);
  }

  private initBrowserListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("hashchange", () => {
      const payload = this.parseUrl(window.location.href);
      if (payload) {
        this.notify(payload);
      }
    });
  }
}

export const deepLinkService = new DeepLinkService();
