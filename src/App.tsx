import { AppShell } from "@/components/layout/AppShell";
import { CreateRoomCard } from "@/components/room/CreateRoomCard";
import { JoinRoomCard } from "@/components/room/JoinRoomCard";
import { FoundationInfoCard } from "@/components/room/FoundationInfoCard";
import { WaitingRoomView } from "@/components/room/WaitingRoomView";
import { ActiveRoomView } from "@/components/room/ActiveRoomView";
import { ExpiredRoomView } from "@/components/room/ExpiredRoomView";
import { RejoinBanner } from "@/components/room/RejoinBanner";
import { RoomProvider, useRoom } from "@/context/RoomContext";
import { Sparkle, WarningCircle, X } from "@phosphor-icons/react";

import { InviteJoinModal } from "@/components/room/InviteJoinModal";

function RoomAppContent() {
  const { status, error, clearError } = useRoom();

  // Render Waiting room (1 participant, 30m countdown running)
  if (status === "waiting") {
    return (
      <>
        <InviteJoinModal />
        <WaitingRoomView />
      </>
    );
  }

  // Render Active room (2 participants, countdown cancelled)
  if (status === "active") {
    return (
      <>
        <InviteJoinModal />
        <ActiveRoomView />
      </>
    );
  }

  // Render Expired room (solo countdown elapsed or closed)
  if (status === "expired" || status === "closed") {
    return (
      <>
        <InviteJoinModal />
        <ExpiredRoomView />
      </>
    );
  }

  // Render Home / Idle Screen
  return (
    <div className="w-full flex flex-col items-center text-center space-y-8 my-auto py-6">
      {/* Direct Invite Link Detection Modal */}
      <InviteJoinModal />

      {/* Rejoin Prompt */}
      <RejoinBanner />

      {/* Error notification banner */}
      {error && (
        <div className="w-full max-w-2xl p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 text-left animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="text-red-400 shrink-0" weight="fill" />
            <div>
              <span className="font-semibold block sm:inline">[{error.code}] </span>
              <span>{error.message}</span>
            </div>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-red-900/50 rounded-lg text-red-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close error notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* Main Action Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreateRoomCard />
        <JoinRoomCard />
      </div>

      {/* Foundation & Architecture Diagnostics */}
      <div className="w-full max-w-4xl">
        <FoundationInfoCard />
      </div>
    </div>
  );
}

export function App() {
  return (
    <RoomProvider>
      <AppShell>
        <RoomAppContent />
      </AppShell>
    </RoomProvider>
  );
}

export default App;
