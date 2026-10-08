import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CheckCircle, GearSix, TerminalWindow, PlugsConnected, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { env } from "@/config/env";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/utils/cn";

export const FoundationInfoCard: React.FC = () => {
  // Diagnostic card is only visible in development environments
  if (!env.isDev) {
    return null;
  }

  const { isTauriApp, isWindows, isAndroid, isWeb } = usePlatform();
  const [rustResponse, setRustResponse] = useState<string | null>(null);
  const [isTestingIpc, setIsTestingIpc] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const testTauriIpc = async () => {
    setIsTestingIpc(true);
    try {
      if (isTauriApp) {
        const res = await invoke<string>("greet", { name: "KunekTayo Developer" });
        setRustResponse(res);
      } else {
        setRustResponse("Web fallback: Tauri IPC is active when running inside Tauri Desktop or Android container.");
      }
    } catch (err) {
      setRustResponse(`IPC test error: ${String(err)}`);
    } finally {
      setIsTestingIpc(false);
    }
  };

  const getTargetLabel = () => {
    if (isWindows) return "Windows Desktop (Tauri 2)";
    if (isAndroid) return "Android (Tauri 2)";
    if (isWeb) return "Web / Vite Preview";
    return "Tauri Desktop";
  };

  return (
    <div className="w-full rounded-2xl border border-[#35373c] bg-[#2b2d31] p-4 sm:p-5 text-left transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <GearSix size={18} className="text-[#949ba4] group-hover:text-[#9098C8] transition-colors" weight="bold" />
          <h3 className="text-xs sm:text-sm font-semibold text-[#dbdee1] uppercase tracking-wider group-hover:text-[#f2f3f5] transition-colors">
            System & Foundation Diagnostics
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="hidden sm:inline-flex">
            <CheckCircle size={13} weight="fill" />
            Tauri 2 • React 19 • Tailwind v4
          </Badge>
          <div className="p-1 rounded-lg text-[#949ba4] group-hover:text-[#f2f3f5] group-hover:bg-[#35373c] transition-colors">
            <CaretDown
              size={16}
              weight="bold"
              className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#35373c] space-y-4 animate-in fade-in duration-150">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] space-y-1">
          <span className="text-[#949ba4]">Runtime Target</span>
          <p className="font-semibold text-[#f2f3f5]">
            {getTargetLabel()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] space-y-1">
          <span className="text-[#949ba4]">Signaling Endpoint</span>
          <p className="font-mono text-[#f2f3f5] truncate" title={env.signalingUrl}>
            {env.signalingUrl}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] space-y-1">
          <span className="text-[#949ba4]">Room Expiration</span>
          <p className="font-semibold text-[#f0b232]">
            {env.roomSoloTimeoutMinutes} mins solo countdown
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] space-y-1">
          <span className="text-[#949ba4]">Ephemeral Chat TTL</span>
          <p className="font-semibold text-[#9098C8]">
            {env.messageDefaultTtlSeconds}s auto-purge
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1e1f22] p-3.5 rounded-xl border border-[#35373c]">
        <div className="flex items-center gap-2.5 text-xs text-[#dbdee1]">
          <TerminalWindow size={16} className="text-[#9098C8]" />
          <span>
            {rustResponse ? (
              <span className="font-mono text-[#9098C8]">{rustResponse}</span>
            ) : (
              "Test Tauri Rust Core Command Bridge:"
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={testTauriIpc}
          isLoading={isTestingIpc}
          icon={<PlugsConnected size={14} />}
        >
          Verify IPC Bridge
        </Button>
      </div>
    </div>
  )}
</div>
  );
};
