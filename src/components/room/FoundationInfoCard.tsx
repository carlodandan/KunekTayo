import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CheckCircle, GearSix, TerminalWindow, PlugsConnected } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { env } from "@/config/env";
import { usePlatform } from "@/hooks/usePlatform";

export const FoundationInfoCard: React.FC = () => {
  const { isTauriApp, isWindows, isAndroid, isWeb } = usePlatform();
  const [rustResponse, setRustResponse] = useState<string | null>(null);
  const [isTestingIpc, setIsTestingIpc] = useState(false);

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
    <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md p-5 sm:p-6 text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GearSix size={18} className="text-slate-400" weight="bold" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Phase 1 Foundation Diagnostics
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <CheckCircle size={13} weight="fill" />
            Tauri 2 + React 19 + Tailwind v4
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400">Runtime Target</span>
          <p className="font-semibold text-slate-200">
            {getTargetLabel()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400">Signaling Endpoint</span>
          <p className="font-mono text-slate-200 truncate" title={env.signalingUrl}>
            {env.signalingUrl}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400">Room Expiration</span>
          <p className="font-semibold text-amber-400">
            {env.roomSoloTimeoutMinutes} mins solo countdown
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-slate-400">Ephemeral Chat TTL</span>
          <p className="font-semibold text-cyan-400">
            {env.messageDefaultTtlSeconds}s auto-purge
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <TerminalWindow size={16} className="text-blue-400" />
          <span>
            {rustResponse ? (
              <span className="font-mono text-emerald-300">{rustResponse}</span>
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
  );
};
