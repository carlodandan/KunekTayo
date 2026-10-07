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
  const [isLocalSwapped, setIsLocalSwapped] = useState(false);

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
      className="relative w-full max-w-4xl mx-auto flex flex-col space-y-3 sm:space-y-4 animate-in fade-in duration-200"
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
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
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

        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <InfinityIcon size={15} className="text-emerald-400" weight="bold" />
            <span className="text-[11px] sm:text-xs">Active (2/2)</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn("grid gap-4 w-full", isChatOpen ? "lg:grid-cols-3" : "grid-cols-1")}>
        {/* Desktop Side-by-Side Split View (visible md:) */}
        <div className={cn("hidden md:grid grid-cols-2 gap-4", isChatOpen ? "lg:col-span-2" : "col-span-1")}>
          <VideoPlayer
            stream={remoteStream}
            label={session?.myRole === "host" ? "Guest (Peer)" : "Host (Peer)"}
            className="aspect-video"
          />
          <VideoPlayer
            stream={localStream}
            label="You"
            isLocal
            isMuted={isMuted}
            isVideoOff={isCameraOff}
            className="aspect-video"
          />
        </div>

        {/* Mobile Stage: Primary Video + Floating Picture-in-Picture (visible < md) */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 md:hidden bg-slate-950">
          {/* Mobile Main Video Feed */}
          <VideoPlayer
            stream={isLocalSwapped ? localStream : remoteStream}
            label={isLocalSwapped ? "You" : session?.myRole === "host" ? "Guest" : "Host"}
            isLocal={isLocalSwapped}
            isMuted={isLocalSwapped ? isMuted : false}
            isVideoOff={isLocalSwapped ? isCameraOff : false}
            className="w-full h-full border-0 rounded-none"
          />

          {/* Mobile Floating Picture-in-Picture (Tap to swap feeds) */}
          <div
            className="absolute bottom-3 right-3 w-28 sm:w-36 aspect-video z-20 shadow-2xl rounded-xl overflow-hidden border border-slate-700/90 bg-slate-900 transition-transform active:scale-95 cursor-pointer ring-1 ring-white/10"
            title="Tap to swap primary feed"
          >
            <VideoPlayer
              stream={isLocalSwapped ? remoteStream : localStream}
              label={isLocalSwapped ? (session?.myRole === "host" ? "Guest" : "Host") : "You"}
              isLocal={!isLocalSwapped}
              isMuted={!isLocalSwapped ? isMuted : false}
              isVideoOff={!isLocalSwapped ? isCameraOff : false}
              isPip
              onClick={() => setIsLocalSwapped(!isLocalSwapped)}
              className="w-full h-full border-0 rounded-none"
            />
          </div>
        </div>

        {/* Desktop Ephemeral Chat Panel (embedded when lg:) */}
        {isChatOpen && (
          <div className="hidden lg:block lg:col-span-1 h-full animate-in fade-in zoom-in-95 duration-150">
            <EphemeralChat className="h-full min-h-[380px]" onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Ephemeral Chat Slide-up Drawer Modal (visible < lg) */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end lg:hidden p-0 animate-in fade-in duration-150"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="w-full max-h-[85vh] bg-slate-950 rounded-t-3xl border-t border-slate-800 p-3 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-2" />
            <EphemeralChat
              className="h-[65vh] border-0 shadow-none bg-transparent"
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        </div>
      )}

      {/* In-Call Controls Floating Bar */}
      <Card
        elevated
        className="p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl border-slate-800/90 flex items-center justify-between gap-1.5 sm:gap-3 sticky bottom-2 z-30"
      >
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center sm:justify-start">
          {/* Microphone Toggle */}
          <Button
            variant={isMuted ? "danger" : "secondary"}
            size="md"
            onClick={toggleMic}
            icon={isMuted ? <MicrophoneSlash size={20} weight="bold" /> : <Microphone size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          />

          {/* Camera Toggle */}
          <Button
            variant={isCameraOff ? "danger" : "secondary"}
            size="md"
            onClick={toggleCamera}
            icon={isCameraOff ? <VideoCameraSlash size={20} weight="bold" /> : <VideoCamera size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
            aria-label={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
          />

          {/* Screen Share Toggle */}
          <Button
            variant={isScreenSharing ? "primary" : "secondary"}
            size="md"
            onClick={toggleScreenShare}
            icon={<ProjectorScreen size={20} weight={isScreenSharing ? "fill" : "bold"} />}
            className={cn("rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]", isScreenSharing && "ring-2 ring-blue-400")}
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
              className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px] text-slate-300 hover:text-white"
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
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
            aria-label={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
          />

          {/* Device Settings Modal */}
          <Button
            variant="ghost"
            size="md"
            onClick={() => setIsSettingsOpen(true)}
            icon={<GearSix size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px] text-slate-400 hover:text-white"
            title="Audio & Video Settings"
            aria-label="Device Settings"
          />
        </div>

        {/* Leave Call */}
        <Button
          variant="danger"
          size="md"
          onClick={leaveRoom}
          icon={<SignOut size={20} weight="bold" />}
          className="rounded-full sm:rounded-xl min-h-[44px] min-w-[44px] w-11 h-11 sm:w-auto p-0 sm:px-4 shrink-0 font-medium"
          title="Leave Call"
          aria-label="Leave Call"
        >
          <span className="hidden sm:inline">Leave Call</span>
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
