import React from "react";
import { Broadcast, Desktop, DeviceMobile, Globe, ShieldCheck } from "@phosphor-icons/react";
import { Badge } from "@/components/common/Badge";
import { usePlatform } from "@/hooks/usePlatform";
import { APP_NAME } from "@/constants/app";

export const Header: React.FC = () => {
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
    <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-4 py-3.5 sm:px-6 sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/10 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Broadcast size={22} weight="duotone" className="text-blue-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">{APP_NAME}</h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v0.1
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Temporary 1-on-1 private voice, video & chat
            </p>
          </div>
        </div>

        {/* Status and Platform */}
        <div className="flex items-center gap-2.5">
          <Badge variant="success" dot>
            <ShieldCheck size={14} weight="fill" className="text-emerald-400" />
            <span className="hidden xs:inline">P2P Ready</span>
          </Badge>
          {getPlatformBadge()}
        </div>
      </div>
    </header>
  );
};
