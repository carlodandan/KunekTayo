import React from "react";
import { ArrowRight, Desktop, DeviceMobile, Globe } from "@phosphor-icons/react";
import { usePlatform } from "@/hooks/usePlatform";
import { APP_NAME } from "@/constants/app";

interface LandingNavProps {
  onLaunchApp: () => void;
  onCreateRoom?: () => void;
  activeView?: "landing" | "app";
  onToggleView?: (view: "landing" | "app") => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onLaunchApp,
  activeView = "landing",
  onToggleView,
}) => {
  const { isAndroid, isWindows } = usePlatform();

  const getPlatformLabel = () => {
    if (isAndroid) return { label: "Android", icon: <DeviceMobile size={13} weight="bold" /> };
    if (isWindows) return { label: "Windows", icon: <Desktop size={13} weight="bold" /> };
    return { label: "Web", icon: <Globe size={13} weight="bold" /> };
  };

  const platform = getPlatformLabel();

  return (
    <nav className="w-full border-b border-[#35373c] bg-[#1e1f22]/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="w-9 h-9 rounded-xl object-contain bg-[#2b2d31] p-1 border border-[#35373c] shrink-0"
          />
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#f2f3f5]">
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#2b2d31] text-[#949ba4] border border-[#35373c] hidden xs:inline-block">
              v0.1
            </span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[#949ba4]">
          <a
            href="#features"
            className="hover:text-[#f2f3f5] transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#f2f3f5] transition-colors cursor-pointer"
          >
            How It Works
          </a>
          <a
            href="#security"
            className="hover:text-[#f2f3f5] transition-colors cursor-pointer"
          >
            Security & Privacy
          </a>
          <a
            href="#downloads"
            className="hover:text-[#f2f3f5] transition-colors cursor-pointer"
          >
            Downloads
          </a>
          <a
            href="#faq"
            className="hover:text-[#f2f3f5] transition-colors cursor-pointer"
          >
            FAQ
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Platform indicator badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2b2d31] border border-[#35373c] text-[#dbdee1] text-xs">
            <span className="text-[#5865f2]">{platform.icon}</span>
            <span>{platform.label}</span>
          </div>

          {/* View Toggle (if onToggleView is provided) */}
          {onToggleView && (
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
                App
              </button>
            </div>
          )}

          {/* Launch App Button */}
          <button
            type="button"
            onClick={onLaunchApp}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] min-h-[40px]"
          >
            <span>Launch App</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>
    </nav>
  );
};
