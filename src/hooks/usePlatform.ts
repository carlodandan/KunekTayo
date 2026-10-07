import { useState, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";

export interface PlatformInfo {
  isTauriApp: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isWeb: boolean;
}

export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => {
    const isApp = isTauri();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isAndroid = ua.includes("android");
    const isWindows = ua.includes("windows") || ua.includes("win32");

    return {
      isTauriApp: isApp,
      isAndroid,
      isWindows: !isAndroid && isWindows,
      isWeb: !isApp,
    };
  });

  useEffect(() => {
    // If running in Tauri, platform detection can be further augmented
    const isApp = isTauri();
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes("android");
    const isWindows = ua.includes("windows") || ua.includes("win32");

    setInfo({
      isTauriApp: isApp,
      isAndroid,
      isWindows: !isAndroid && isWindows,
      isWeb: !isApp,
    });
  }, []);

  return info;
}
