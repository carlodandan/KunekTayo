import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CreateRoomCard } from "@/components/room/CreateRoomCard";
import { JoinRoomCard } from "@/components/room/JoinRoomCard";
import { FoundationInfoCard } from "@/components/room/FoundationInfoCard";
import { Sparkle, ShieldCheck, X } from "@phosphor-icons/react";

export function App() {
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const handleRoomCreated = (roomId: string) => {
    setActiveNotice(
      `Room token generated: ${roomId}. In Phase 2, this initiates the Durable Object room session.`
    );
  };

  const handleRoomJoined = (roomId: string) => {
    setActiveNotice(
      `Joining room: ${roomId}. In Phase 3, this establishes WebRTC signaling.`
    );
  };

  return (
    <AppShell>
      <div className="w-full flex flex-col items-center text-center space-y-8 my-auto py-6">
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkle size={13} weight="fill" />
            <span>Lightweight • Temporary • 1-to-1</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Connect directly. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Ephemeral by design.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Create a private room. Send the link to one person. Direct peer-to-peer
            audio, video, and vanishing chat with zero accounts and zero footprints.
          </p>
        </div>

        {/* Notice Banner */}
        {activeNotice && (
          <div className="w-full max-w-2xl p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs sm:text-sm flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400 shrink-0" />
              <span>{activeNotice}</span>
            </div>
            <button
              onClick={() => setActiveNotice(null)}
              className="p-1 hover:bg-blue-900/50 rounded-lg text-blue-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateRoomCard onCreateRoom={handleRoomCreated} />
          <JoinRoomCard onJoinRoom={handleRoomJoined} />
        </div>

        {/* Foundation & Architecture Diagnostics */}
        <div className="w-full max-w-4xl">
          <FoundationInfoCard />
        </div>
      </div>
    </AppShell>
  );
}

export default App;
