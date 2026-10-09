import React, { useState, useEffect, useRef } from "react";
import {
  SignOutIcon,
  InfinityIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ChatTextIcon,
  GearSixIcon,
  ArrowsOutIcon,
  ArrowsInIcon,
  ProjectorScreenIcon,
  FileArrowUpIcon,
  PictureInPictureIcon,
  FireIcon,
  DotsThreeIcon,
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
import { useChat } from "@/context/ChatContext";
import { isNativePipSupported, requestNativePip } from "@/services/androidPipService";
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
  const { messages, isPeerTyping } = useChat();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFileShareOpen, setIsFileShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLocalSwapped, setIsLocalSwapped] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Ticker for real-time TTL countdown updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track viewport breakpoint to prevent rendering duplicate WebRTC video sinks
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const desktopRemoteVideoRef = useRef<HTMLVideoElement>(null);
  const mobileMainVideoRef = useRef<HTMLVideoElement>(null);
  const mobileFloatingVideoRef = useRef<HTMLVideoElement>(null);

  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isBrowserPiPActive, setIsBrowserPiPActive] = useState(false);
  const [isNativePiPActive, setIsNativePiPActive] = useState(false);
  const isPiPActive = isBrowserPiPActive || isNativePiPActive;
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Check Picture-in-Picture support (Android native Activity PiP or browser HTML5 PiP)
  useEffect(() => {
    const supported =
      isNativePipSupported() ||
      (typeof document !== "undefined" &&
        Boolean(document.pictureInPictureEnabled) &&
        typeof HTMLVideoElement !== "undefined" &&
        typeof HTMLVideoElement.prototype.requestPictureInPicture === "function");
    setIsPiPSupported(supported);
  }, []);

  // Listen to native Android Activity PiP mode transitions
  useEffect(() => {
    const handleAndroidPip = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPip?: boolean }>;
      if (customEvent.detail?.isPip !== undefined) {
        setIsNativePiPActive(Boolean(customEvent.detail.isPip));
      }
    };
    window.addEventListener("android:pip-changed", handleAndroidPip);
    return () => window.removeEventListener("android:pip-changed", handleAndroidPip);
  }, []);

  // Monitor active video tracks on remote stream
  useEffect(() => {
    if (!remoteStream) {
      setHasRemoteVideo(false);
      return;
    }

    const updateTrackState = () => {
      const videoTracks = remoteStream.getVideoTracks();
      const hasActiveVideo =
        videoTracks.length > 0 &&
        videoTracks.some((t) => t.readyState === "live" && t.enabled);
      setHasRemoteVideo(hasActiveVideo);
    };

    updateTrackState();

    remoteStream.addEventListener("addtrack", updateTrackState);
    remoteStream.addEventListener("removetrack", updateTrackState);

    const tracks = remoteStream.getVideoTracks();
    tracks.forEach((track) => {
      track.addEventListener("ended", updateTrackState);
      track.addEventListener("mute", updateTrackState);
      track.addEventListener("unmute", updateTrackState);
    });

    return () => {
      remoteStream.removeEventListener("addtrack", updateTrackState);
      remoteStream.removeEventListener("removetrack", updateTrackState);
      tracks.forEach((track) => {
        track.removeEventListener("ended", updateTrackState);
        track.removeEventListener("mute", updateTrackState);
        track.removeEventListener("unmute", updateTrackState);
      });
    };
  }, [remoteStream]);

  // Synchronize Picture-in-Picture events across candidate video elements
  useEffect(() => {
    const onEnter = () => setIsBrowserPiPActive(true);
    const onLeave = () => setIsBrowserPiPActive(false);

    const elements = [
      desktopRemoteVideoRef.current,
      mobileMainVideoRef.current,
      mobileFloatingVideoRef.current,
    ].filter(Boolean) as HTMLVideoElement[];

    elements.forEach((el) => {
      el.addEventListener("enterpictureinpicture", onEnter);
      el.addEventListener("leavepictureinpicture", onLeave);
    });

    if (typeof document !== "undefined") {
      setIsBrowserPiPActive(
        Boolean(
          document.pictureInPictureElement &&
            elements.includes(document.pictureInPictureElement as HTMLVideoElement)
        )
      );
    }

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("enterpictureinpicture", onEnter);
        el.removeEventListener("leavepictureinpicture", onLeave);
      });
    };
  }, [remoteStream, isLocalSwapped]);

  // Ensure Picture-in-Picture is exited if component unmounts
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined" && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    };
  }, []);

  const getActiveRemoteVideoElement = (): HTMLVideoElement | null => {
    const desktopEl = desktopRemoteVideoRef.current;
    if (desktopEl && (desktopEl.offsetWidth > 0 || desktopEl.getClientRects().length > 0)) {
      return desktopEl;
    }

    if (isLocalSwapped) {
      const floatingEl = mobileFloatingVideoRef.current;
      if (floatingEl && (floatingEl.offsetWidth > 0 || floatingEl.getClientRects().length > 0)) {
        return floatingEl;
      }
    } else {
      const mainEl = mobileMainVideoRef.current;
      if (mainEl && (mainEl.offsetWidth > 0 || mainEl.getClientRects().length > 0)) {
        return mainEl;
      }
    }

    return (
      (isLocalSwapped ? mobileFloatingVideoRef.current : mobileMainVideoRef.current) ||
      desktopRemoteVideoRef.current ||
      null
    );
  };

  const togglePiP = async () => {
    // If Android native Activity PiP bridge is available, trigger native OS PiP
    if (isNativePipSupported()) {
      const entered = requestNativePip();
      if (entered) {
        setIsNativePiPActive(true);
        return;
      }
    }

    if (!isPiPSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsBrowserPiPActive(false);
      } else {
        const videoEl = getActiveRemoteVideoElement();
        if (videoEl) {
          await videoEl.requestPictureInPicture();
          setIsBrowserPiPActive(true);
        }
      }
    } catch (err) {
      console.warn("Picture-in-Picture toggle failed:", err);
    }
  };

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

  // Filter unexpired messages and take the last 2 for the mobile 2-line chat box
  const activeMessages = messages.filter((msg) => msg.expiresAt > now);
  const recentMessages = activeMessages.slice(-2);

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
      className={cn(
        "relative w-full max-w-4xl mx-auto flex flex-col space-y-1.5 sm:space-y-4 animate-in fade-in duration-200",
        isNativePiPActive && "fixed inset-0 z-50 h-screen w-screen p-0 m-0 space-y-0 bg-black justify-center items-center max-w-none rounded-none"
      )}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-[#1e1f22]/95 rounded-3xl border-2 border-dashed border-[#283E7C] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150">
          <FileArrowUpIcon size={48} className="text-[#9098C8] mb-2 animate-bounce" weight="bold" />
          <h3 className="text-lg font-bold text-[#f2f3f5]">Drop files to send privately</h3>
          <p className="text-xs text-[#949ba4] mt-1 max-w-xs">
            Direct WebRTC P2P in-memory transfer. Vanishes completely on exit. Zero server upload.
          </p>
        </div>
      )}

      {/* Top Bar Status */}
      <div className={cn("flex items-center justify-between gap-2 px-1 py-0.5", isNativePiPActive && "hidden")}>
        <div className="flex items-center gap-2 flex-wrap">
          <ConnectionQualityBadge />
          {isScreenSharing && (
            <Badge variant="warning" dot>
              <ProjectorScreenIcon size={13} weight="fill" />
              <span>Screen Sharing</span>
            </Badge>
          )}
          <span className="text-xs text-[#949ba4] hidden sm:inline">
            Room #{session?.roomId.substring(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#949ba4]">
          <div className="flex items-center gap-1.5">
            <InfinityIcon size={15} className="text-[#9098C8]" weight="bold" />
            <span className="text-[11px] sm:text-xs">Active (2/2)</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded-lg text-[#949ba4] hover:text-[#f2f3f5] hover:bg-[#35373c] transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <ArrowsInIcon size={16} /> : <ArrowsOutIcon size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn("grid gap-4 w-full", isChatOpen ? "lg:grid-cols-3" : "grid-cols-1")}>
        {/* Desktop Side-by-Side Split View (only mounted on desktop >= md to prevent duplicate video sinks/decoders) */}
        {!isMobile && (
          <div className={cn("grid grid-cols-2 gap-4", isChatOpen ? "lg:col-span-2" : "col-span-1")}>
            <VideoPlayer
              ref={desktopRemoteVideoRef}
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
        )}

        {/* Mobile Stage: Semi-portrait, semi-fullscreen video + Top-right PiP (only mounted on mobile < md) */}
        {isMobile && (
          <div
            className={cn(
              "relative w-full aspect-[9/15] sm:aspect-video min-h-[460px] max-h-[76vh] rounded-2xl overflow-hidden border border-[#35373c] bg-[#1e1f22]",
              isNativePiPActive && "fixed inset-0 z-50 h-screen w-screen aspect-auto rounded-none border-0 min-h-0 max-h-none"
            )}
          >
            {/* Mobile Main Video Feed */}
            <VideoPlayer
              ref={mobileMainVideoRef}
              stream={isLocalSwapped ? localStream : remoteStream}
              label={isLocalSwapped ? "You" : session?.myRole === "host" ? "Guest" : "Host"}
              isLocal={isLocalSwapped}
              isMuted={isLocalSwapped ? isMuted : false}
              isVideoOff={isLocalSwapped ? isCameraOff : false}
              className="w-full h-full border-0 rounded-none"
            />

            {/* Mobile Floating Picture-in-Picture (Tap to swap feeds, positioned top-right) */}
            <div
              className={cn(
                "absolute top-2.5 right-2.5 w-24 sm:w-28 aspect-[3/4] z-20 rounded-xl overflow-hidden border border-[#35373c] bg-[#2b2d31] shadow-lg transition-transform active:scale-95 cursor-pointer",
                isNativePiPActive && "hidden"
              )}
              title="Tap to swap primary feed"
            >
              <VideoPlayer
                ref={mobileFloatingVideoRef}
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
        )}

        {/* DesktopIcon Ephemeral Chat Panel (embedded when lg:) */}
        {isChatOpen && (
          <div className="hidden lg:block lg:col-span-1 h-full animate-in fade-in duration-150">
            <EphemeralChat className="h-full min-h-[380px]" onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Ephemeral Chat Slide-up Drawer Modal (visible < lg) */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end lg:hidden p-0 animate-in fade-in duration-150"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="w-full max-h-[85vh] bg-[#2b2d31] rounded-t-3xl border-t border-[#35373c] p-3 pb-safe animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[#4e5058] rounded-full mx-auto mb-2" />
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
        className={cn(
          "p-2 sm:p-4 bg-[#2b2d31] border-[#35373c] flex items-center justify-between gap-1.5 sm:gap-3 sticky bottom-2 z-30",
          isNativePiPActive && "hidden"
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center sm:justify-start">
          {/* MicrophoneIcon Toggle */}
          <Button
            variant={isMuted ? "danger" : "secondary"}
            size="md"
            onClick={toggleMic}
            icon={isMuted ? <MicrophoneSlashIcon size={20} weight="bold" /> : <MicrophoneIcon size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isMuted ? "Unmute MicrophoneIcon" : "Mute MicrophoneIcon"}
            aria-label={isMuted ? "Unmute MicrophoneIcon" : "Mute MicrophoneIcon"}
          />

          {/* Camera Toggle */}
          <Button
            variant={isCameraOff ? "danger" : "secondary"}
            size="md"
            onClick={toggleCamera}
            icon={isCameraOff ? <VideoCameraSlashIcon size={20} weight="bold" /> : <VideoCameraIcon size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
            aria-label={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
          />

          {/* Screen Share Toggle */}
          <Button
            variant={isScreenSharing ? "primary" : "secondary"}
            size="md"
            onClick={toggleScreenShare}
            icon={<ProjectorScreenIcon size={20} weight={isScreenSharing ? "fill" : "bold"} />}
            className={cn("rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]", isScreenSharing && "border-2 border-[#283E7C]")}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
            aria-label={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          />

          {/* Picture-in-Picture Toggle */}
          {isPiPSupported && (hasRemoteVideo || isPiPActive) && (
            <Button
              variant={isPiPActive ? "primary" : "secondary"}
              size="md"
              onClick={togglePiP}
              disabled={!hasRemoteVideo && !isPiPActive}
              icon={
                <PictureInPictureIcon
                  size={20}
                  weight={isPiPActive ? "fill" : "bold"}
                />
              }
              className={cn(
                "rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]",
                isPiPActive && "border-2 border-[#283E7C]"
              )}
              title={isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
              aria-label={isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
            />
          )}

          {/* Ephemeral File Sharing Button */}
          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsFileShareOpen(true)}
              icon={<FileArrowUpIcon size={20} weight="bold" />}
              className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px] text-[#dbdee1] hover:text-white"
              title="P2P Shared Files (Drag & Drop)"
              aria-label="P2P Shared Files"
            />
            {files.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#283E7C] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">
                {files.length}
              </span>
            )}
          </div>

          {/* Ephemeral Chat Toggle */}
          <Button
            variant={isChatOpen ? "primary" : "secondary"}
            size="md"
            onClick={() => setIsChatOpen(!isChatOpen)}
            icon={<ChatTextIcon size={20} weight="bold" />}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 min-h-[44px] min-w-[44px]"
            title={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
            aria-label={isChatOpen ? "Hide Chat" : "Open Ephemeral Chat"}
          />

          {/* Device Settings Modal */}
          <Button
            variant="ghost"
            size="md"
            onClick={() => setIsSettingsOpen(true)}
            icon={<GearSixIcon size={20} weight="bold" />}
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
          icon={<SignOutIcon size={20} weight="bold" />}
          className="rounded-full sm:rounded-xl min-h-[44px] min-w-[44px] w-11 h-11 sm:w-auto p-0 sm:px-4 shrink-0 font-medium"
          title="Leave Call"
          aria-label="Leave Call"
        >
          <span className="hidden sm:inline">Leave Call</span>
        </Button>
      </Card>

      {/* Mobile 2-Line Ephemeral Chat Box placed below the buttons (visible < md) */}
      {!isNativePiPActive && (
        <div
          onClick={() => setIsChatOpen(true)}
          className="w-full bg-[#2b2d31] border border-[#35373c] rounded-2xl p-2.5 shadow-md cursor-pointer transition-all hover:bg-[#32353b] active:scale-[0.99] flex flex-col justify-center space-y-1.5 select-none md:hidden"
          title="Tap to open Ephemeral Chat"
          aria-label="Open Ephemeral Chat"
        >
          {recentMessages.length >= 2 ? (
            <>
              {/* Line 1: 2nd most recent message */}
              <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
                      recentMessages[0].senderId === session?.myParticipantId
                        ? "bg-[#283E7C]/40 border-[#283E7C] text-[#f2f3f5]"
                        : "bg-[#9098C8]/20 border-[#9098C8]/40 text-[#9098C8]"
                    )}
                  >
                    {recentMessages[0].senderId === session?.myParticipantId ? "You" : "Peer"}
                  </span>
                  <span className="text-[#f2f3f5] truncate text-[11px] sm:text-xs">
                    {recentMessages[0].text}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-[#f0b232] font-mono text-[10px] shrink-0 font-medium">
                  <FireIcon size={11} weight="fill" />
                  {Math.max(0, Math.ceil((recentMessages[0].expiresAt - now) / 1000))}s
                </span>
              </div>

              {/* Line 2: Most recent message */}
              <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
                      recentMessages[1].senderId === session?.myParticipantId
                        ? "bg-[#283E7C]/40 border-[#283E7C] text-[#f2f3f5]"
                        : "bg-[#9098C8]/20 border-[#9098C8]/40 text-[#9098C8]"
                    )}
                  >
                    {recentMessages[1].senderId === session?.myParticipantId ? "You" : "Peer"}
                  </span>
                  <span className="text-[#f2f3f5] truncate text-[11px] sm:text-xs">
                    {recentMessages[1].text}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-[#f0b232] font-mono text-[10px] shrink-0 font-medium">
                  <FireIcon size={11} weight="fill" />
                  {Math.max(0, Math.ceil((recentMessages[1].expiresAt - now) / 1000))}s
                </span>
              </div>
            </>
          ) : recentMessages.length === 1 ? (
            <>
              {/* Line 1: Single active message */}
              <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
                      recentMessages[0].senderId === session?.myParticipantId
                        ? "bg-[#283E7C]/40 border-[#283E7C] text-[#f2f3f5]"
                        : "bg-[#9098C8]/20 border-[#9098C8]/40 text-[#9098C8]"
                    )}
                  >
                    {recentMessages[0].senderId === session?.myParticipantId ? "You" : "Peer"}
                  </span>
                  <span className="text-[#f2f3f5] truncate text-[11px] sm:text-xs">
                    {recentMessages[0].text}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-[#f0b232] font-mono text-[10px] shrink-0 font-medium">
                  <FireIcon size={11} weight="fill" />
                  {Math.max(0, Math.ceil((recentMessages[0].expiresAt - now) / 1000))}s
                </span>
              </div>

              {/* Line 2: Typing indicator or Tap to reply prompt */}
              {isPeerTyping ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#9098C8] animate-pulse">
                  <DotsThreeIcon size={16} weight="bold" />
                  <span>Peer is typing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-[#949ba4]">
                  <span className="truncate">Tap to open chat or reply...</span>
                  <span className="text-[10px] text-[#9098C8] flex items-center gap-1 shrink-0 font-medium">
                    <span>Reply</span>
                    <ChatTextIcon size={12} weight="bold" />
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Line 1: Ephemeral Chat header notice */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#f2f3f5] font-medium">
                  <FireIcon size={13} className="text-[#f0b232]" weight="fill" />
                  <span>Ephemeral Chat</span>
                  <span className="text-[10px] text-[#949ba4] font-normal">• Direct P2P</span>
                </div>
                <span className="text-[10px] text-[#9098C8] flex items-center gap-1 font-medium">
                  <span>Chat</span>
                  <ChatTextIcon size={12} weight="bold" />
                </span>
              </div>

              {/* Line 2: Typing or prompt to chat */}
              {isPeerTyping ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#9098C8] animate-pulse">
                  <DotsThreeIcon size={16} weight="bold" />
                  <span>Peer is typing...</span>
                </div>
              ) : (
                <div className="text-[11px] text-[#949ba4] truncate">
                  No active messages • Tap to send a vanishing message
                </div>
              )}
            </>
          )}
        </div>
      )}

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
