import React, { useState } from "react";
import {
  SignOut,
  Infinity as InfinityIcon,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  ChatText,
  GearSix,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { DeviceSelectorModal } from "@/components/media/DeviceSelectorModal";
import { ConnectionQualityBadge } from "@/components/room/ConnectionQualityBadge";
import { EphemeralChat } from "@/components/chat/EphemeralChat";
import { useRoom } from "@/context/RoomContext";
import { useWebRtc } from "@/context/WebRtcContext";
import { cn } from "@/utils/cn";

export const ActiveRoomView: React.FC = () => {
  const { session, leaveRoom } = useRoom();
  const {
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
  } = useWebRtc();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-4 animate-in fade-in duration-200">
      {/* Top Bar Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <ConnectionQualityBadge />
          <span className="text-xs text-slate-400 hidden sm:inline">
            Room #{session?.roomId.substring(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <InfinityIcon size={16} className="text-emerald-400" weight="bold" />
            <span>Active Indefinitely (2/2)</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content: Video Grid and Optional Ephemeral Chat Drawer */}
      <div className={cn("grid gap-4 w-full", isChatOpen ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
        {/* Video Streams Container */}
        <div className={cn("grid grid-cols-1 gap-4", isChatOpen ? "lg:col-span-2 sm:grid-cols-2" : "md:grid-cols-2")}>
          {/* Remote Participant Video */}
          <VideoPlayer
            stream={remoteStream}
            label={session?.myRole === "host" ? "Guest (Peer)" : "Host (Peer)"}
            className="aspect-video"
          />

          {/* Local Participant Video */}
          <VideoPlayer
            stream={localStream}
            label="You"
            isLocal
            isMuted={isMuted}
            isVideoOff={isCameraOff}
            className="aspect-video"
          />
        </div>

        {/* Ephemeral Chat Drawer */}
        {isChatOpen && (
          <div className="lg:col-span-1 h-full animate-in fade-in zoom-in-95 duration-150">
            <EphemeralChat className="h-full min-h-[380px]" />
          </div>
        )}
      </div>

      {/* In-Call Controls Floating Bar */}
      <Card
        elevated
        className="p-3.5 sm:p-4 bg-slate-950/80 backdrop-blur-xl border-slate-800 flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Microphone Toggle */}
          <Button
            variant={isMuted ? "danger" : "secondary"}
            size="md"
            onClick={toggleMic}
            icon={isMuted ? <MicrophoneSlash size={20} weight="bold" /> : <Microphone size={20} weight="bold" />}
            className="rounded-full w-12 h-12 p-0 min-h-[48px]"
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          />

          {/* Camera Toggle */}
          <Button
            variant={isCameraOff ? "danger" : "secondary"}
            size="md"
            onClick={toggleCamera}
            icon={isCameraOff ? <VideoCameraSlash size={20} weight="bold" /> : <VideoCamera size={20} weight="bold" />}
            className="rounded-full w-12 h-12 p-0 min-h-[48px]"
            title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
            aria-label={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
          />

          {/* Ephemeral Chat Toggle */}
          <Button
            variant={isChatOpen ? "primary" : "secondary"}
            size="md"
            onClick={() => setIsChatOpen(!isChatOpen)}
            icon={<ChatText size={20} weight="bold" />}
            className="rounded-full w-12 h-12 p-0 min-h-[48px]"
            title={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
            aria-label={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
          />

          {/* Device Settings Modal */}
          <Button
            variant="ghost"
            size="md"
            onClick={() => setIsSettingsOpen(true)}
            icon={<GearSix size={20} weight="bold" />}
            className="rounded-full w-12 h-12 p-0 min-h-[48px] text-slate-400 hover:text-white"
            title="Audio & Video Settings"
            aria-label="Device Settings"
          />
        </div>

        {/* Leave Call */}
        <Button
          variant="danger"
          size="md"
          onClick={leaveRoom}
          icon={<SignOut size={18} weight="bold" />}
          className="min-h-[48px]"
        >
          Leave Call
        </Button>
      </Card>

      {/* Device Selection Settings Modal */}
      <DeviceSelectorModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
