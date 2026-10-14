/**
 * Android Native Picture-in-Picture & Background Call Service Bridge
 * Provides bidirectional communication between React/WebRTC and Android's native
 * Activity PiP and Foreground Call Notification Service.
 */

declare global {
  interface Window {
    AndroidCallBridge?: {
      setCallActive: (active: boolean) => void;
      enterPip: () => boolean;
      isSupported?: () => boolean;
    };
  }
}

/**
 * Notifies the native Android container whether a call is active.
 * When active=true: Android launches a Foreground Service with an ongoing notification
 * to preserve microphone access and prevents WebView pausing in the background.
 * Also configures PiP auto-enter on Android 12+ home gestures.
 */
export function notifyNativeCallState(active: boolean): void {
  if (typeof window !== "undefined" && window.AndroidCallBridge?.setCallActive) {
    try {
      window.AndroidCallBridge.setCallActive(active);
    } catch (err) {
      console.warn("[AndroidPipService] Failed to notify native call state:", err);
    }
  }
}

/**
 * Requests the native Android container to enter Picture-in-Picture mode immediately.
 * Returns true if successfully requested on Android.
 */
export function requestNativePip(): boolean {
  if (typeof window !== "undefined" && window.AndroidCallBridge?.enterPip) {
    try {
      return window.AndroidCallBridge.enterPip();
    } catch (err) {
      console.warn("[AndroidPipService] Failed to enter native PiP:", err);
      return false;
    }
  }
  return false;
}

/**
 * Checks if the native Android PiP bridge is available in the current environment.
 */
export function isNativePipSupported(): boolean {
  if (typeof window === "undefined" || !window.AndroidCallBridge) return false;
  return window.AndroidCallBridge.isSupported?.() !== false;
}

/**
 * Sets up an automatic PiP trigger when the user triggers back navigation
 * (back swipe gesture or hardware/software back button).
 * Pushes a history entry to intercept the navigation and returns an unbind cleanup function.
 */
export function setupAutoPipOnBack(onPipTriggered?: () => void): () => void {
  if (typeof window === "undefined" || !window.history || !window.addEventListener) {
    return () => {};
  }

  try {
    window.history.pushState({ kunektayoCall: true }, "");
  } catch {
    // History restricted
  }

  const handlePopState = () => {
    try {
      window.history.pushState({ kunektayoCall: true }, "");
    } catch {
      // History restricted
    }

    if (isNativePipSupported()) {
      const entered = requestNativePip();
      if (entered) {
        onPipTriggered?.();
      }
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}
