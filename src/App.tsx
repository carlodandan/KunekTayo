import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CreateRoomCard } from "@/components/room/CreateRoomCard";
import { JoinRoomCard } from "@/components/room/JoinRoomCard";
import { FoundationInfoCard } from "@/components/room/FoundationInfoCard";
import { env } from "@/config/env";
import { WaitingRoomView } from "@/components/room/WaitingRoomView";
import { ActiveRoomView } from "@/components/room/ActiveRoomView";
import { ExpiredRoomView } from "@/components/room/ExpiredRoomView";
import { RejoinBanner } from "@/components/room/RejoinBanner";
import { LandingPage } from "@/components/landing/LandingPage";
import { RoomProvider, useRoom } from "@/context/RoomContext";
import { WebRtcProvider } from "@/context/WebRtcContext";
import { ChatProvider } from "@/context/ChatContext";
import { FileTransferProvider } from "@/context/FileTransferContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { usePlatform } from "@/hooks/usePlatform";
import { WarningCircle, X } from "@phosphor-icons/react";
import { InviteJoinModal } from "@/components/room/InviteJoinModal";

function RoomAppContent() {
  const { status, error, clearError, createRoom } = useRoom();
  const { isWeb } = usePlatform();

  // On web, start on the sleek landing page; on native desktop/mobile apps (Windows / Android),
  // completely bypass the landing page and go directly into the app workspace.
  // If an invite link is detected in URL, always show app workspace with the join modal.
  const [currentView, setCurrentView] = useState<"landing" | "app">(() => {
    if (!isWeb) return "app";
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (hash.includes("room=") || search.includes("room=") || hash.includes("join")) {
        return "app";
      }
    }
    return "landing";
  });

  // Render Waiting room (1 participant, 30m countdown running)
  if (status === "waiting") {
    return (
      <AppShell>
        <InviteJoinModal />
        <WaitingRoomView />
      </AppShell>
    );
  }

  // Render Active room (2 participants, countdown cancelled)
  if (status === "active") {
    return (
      <AppShell>
        <InviteJoinModal />
        <ActiveRoomView />
      </AppShell>
    );
  }

  // Render Expired room (solo countdown elapsed or closed)
  if (status === "expired" || status === "closed") {
    return (
      <AppShell>
        <InviteJoinModal />
        <ExpiredRoomView />
      </AppShell>
    );
  }

  // If in idle state and on the web, render landing page
  // On native desktop (Windows) and mobile (Android) apps, LandingPage is completely hidden.
  if (isWeb && currentView === "landing") {
    return (
      <>
        <InviteJoinModal />
        <LandingPage
          onLaunchApp={() => setCurrentView("app")}
          onCreateRoom={async () => {
            setCurrentView("app");
            await createRoom();
          }}
          onJoinRoom={() => setCurrentView("app")}
          activeView="landing"
          onToggleView={(view) => setCurrentView(view)}
        />
      </>
    );
  }

  // Render Home / Idle Workspace Screen
  return (
    <AppShell
      activeView="app"
      onToggleView={isWeb ? (view) => setCurrentView(view) : undefined}
      showViewToggle={isWeb}
    >
      <div className="w-full flex flex-col items-center text-center space-y-5 sm:space-y-8 my-auto py-2 sm:py-6">
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
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#f2f3f5] tracking-tight leading-tight">
            Connect directly. <br className="hidden sm:inline" />
            <span className="text-[#9098C8]">
              Ephemeral by design.
            </span>
          </h2>

          <p className="text-xs sm:text-base text-[#949ba4] max-w-lg mx-auto leading-relaxed px-2">
            Create a private room. Send the link to one person. Direct peer-to-peer
            audio, video, and vanishing chat with zero accounts and zero footprints.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <CreateRoomCard />
          <JoinRoomCard />
        </div>

        {/* Foundation & Architecture Diagnostics (Development only) */}
        {env.isDev && (
          <div className="w-full max-w-4xl">
            <FoundationInfoCard />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <RoomProvider>
        <WebRtcProvider>
          <ChatProvider>
            <FileTransferProvider>
              <RoomAppContent />
            </FileTransferProvider>
          </ChatProvider>
        </WebRtcProvider>
      </RoomProvider>
    </ErrorBoundary>
  );
}

export default App;
