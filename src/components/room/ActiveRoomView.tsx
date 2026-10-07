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
  ProjectorScreen,
  FileArrowUp,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { DeviceSelectorModal } from "@/components/media/DeviceSelectorModal";
import { FileShareModal } from "@/components/media/FileShareModal";
import { ConnectionQualityBadge } from "@/components/room/ConnectionQualityBadge";
import { EphemeralChat } from "@/components/chat/EphemeralChat";
import { useRoom } from "@/context/RoomContext";
import { useWebRtc } from "@/context/WebRtcContext";
import { useFileTransfer } from "@/context/FileTransferContext";
import { cn } from "@/utils/cn";

export const ActiveRoomView: React.FC = () => {
  const { session, leaveRoom } = useRoom();
  const {
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  } = useWebRtc();
  const { files, sendFile } = useFileTransfer();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFileShareOpen, setIsFileShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!e.dataTransfer.files) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const f of droppedFiles) {
      await sendFile(f);
    }
    if (droppedFiles.length > 0) {
      setIsFileShareOpen(true);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={handleDrop}
      className="relative w-full max-w-4xl mx-auto flex flex-col space-y-4 animate-in fade-in duration-200"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-blue-950/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-blue-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150">
          <FileArrowUp size={48} className="text-blue-300 mb-2 animate-bounce" weight="bold" />
          <h3 className="text-lg font-bold text-white">Drop files to send privately</h3>
          <p className="text-xs text-blue-200 mt-1 max-w-xs">
            Direct WebRTC P2P in-memory transfer. Vanishes completely on exit. Zero server upload.
          </p>
        </div>
      )}

      {/* Top Bar Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <ConnectionQualityBadge />
          {isScreenSharing && (
            <Badge variant="warning" dot>
              <ProjectorScreen size={13} weight="fill" />
              <span>Screen Sharing</span>
            </Badge>
          )}
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

          {/* Screen Share Toggle */}
          <Button
            variant={isScreenSharing ? "primary" : "secondary"}
            size="md"
            onClick={toggleScreenShare}
            icon={<ProjectorScreen size={20} weight={isScreenSharing ? "fill" : "bold"} />}
            className={cn("rounded-full w-12 h-12 p-0 min-h-[48px]", isScreenSharing && "ring-2 ring-blue-400")}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
            aria-label={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          />

          {/* Ephemeral File Sharing Button */}
          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsFileShareOpen(true)}
              icon={<FileArrowUp size={20} weight="bold" />}
              className="rounded-full w-12 h-12 p-0 min-h-[48px] text-slate-300 hover:text-white"
              title="P2P Shared Files (Drag & Drop)"
              aria-label="P2P Shared Files"
            />
            {files.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none shadow-md">
                {files.length}
              </span>
            )}
          </div>

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

      {/* Ephemeral File Sharing Modal */}
      <FileShareModal
        isOpen={isFileShareOpen}
        onClose={() => setIsFileShareOpen(false)}
      />
    </div>
  );
};
