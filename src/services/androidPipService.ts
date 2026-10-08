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
  return typeof window !== "undefined" && Boolean(window.AndroidCallBridge);
}
