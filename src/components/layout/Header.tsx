import React from "react";
import { Desktop, DeviceMobile, Globe, ShieldCheck } from "@phosphor-icons/react";
import { Badge } from "@/components/common/Badge";
import { usePlatform } from "@/hooks/usePlatform";
import { APP_NAME, APP_VERSION } from "@/constants/app";

export interface HeaderProps {
  activeView?: "landing" | "app";
  onToggleView?: (view: "landing" | "app") => void;
  showViewToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView = "app",
  onToggleView,
  showViewToggle = false,
}) => {
  const { isAndroid, isWindows, isWeb } = usePlatform();

  const getPlatformBadge = () => {
    if (isAndroid) {
      return (
        <Badge variant="info">
          <DeviceMobile size={13} weight="bold" />
          Android
        </Badge>
      );
    }
    if (isWindows) {
      return (
        <Badge variant="info">
          <Desktop size={13} weight="bold" />
          Windows
        </Badge>
      );
    }
    if (isWeb) {
      return (
        <Badge variant="neutral">
          <Globe size={13} weight="bold" />
          Web Preview
        </Badge>
      );
    }
    return null;
  };

  return (
    <header className="w-full border-b border-[#35373c] bg-[#1e1f22] px-4 py-3 sm:px-6 sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity using Tauri generated logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="w-10 h-10 rounded-xl object-contain bg-[#2b2d31] p-1 border border-[#35373c] shrink-0 cursor-pointer"
            onClick={() => onToggleView?.("landing")}
            title="Go to Overview"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-bold tracking-tight text-[#f2f3f5] cursor-pointer hover:text-[#5865f2] transition-colors"
                onClick={() => onToggleView?.("landing")}
              >
                {APP_NAME}
              </h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#2b2d31] text-[#949ba4] border border-[#35373c]">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-[#949ba4] hidden sm:block">
              Temporary 1-on-1 private voice, video & chat
            </p>
          </div>
        </div>

        {/* Status, Toggle and Platform */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {showViewToggle && onToggleView && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#2b2d31] border border-[#35373c] text-xs">
              <button
                type="button"
                onClick={() => onToggleView("landing")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeView === "landing"
                    ? "bg-[#35373c] text-[#f2f3f5]"
                    : "text-[#949ba4] hover:text-[#f2f3f5]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => onToggleView("app")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeView === "app"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#949ba4] hover:text-[#f2f3f5]"
                }`}
              >
                Workspace
              </button>
            </div>
          )}

          <Badge variant="success" dot className="hidden xs:inline-flex">
            <ShieldCheck size={14} weight="fill" className="text-emerald-400" />
            <span>P2P Ready</span>
          </Badge>
          {getPlatformBadge()}
        </div>
      </div>
    </header>
  );
};
