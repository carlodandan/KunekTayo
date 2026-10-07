import React from "react";
import {
  ShieldCheck,
  SignOut,
  Infinity as InfinityIcon,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  WifiHigh,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { useRoom } from "@/context/RoomContext";
import { useWebRtc } from "@/context/WebRtcContext";

export const ActiveRoomView: React.FC = () => {
  const { session, leaveRoom } = useRoom();
  const {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
  } = useWebRtc();

  const isConnected = connectionState === "connected";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-5 animate-in fade-in duration-200">
      {/* Top Bar Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "success" : "warning"} dot>
            <ShieldCheck size={14} weight="fill" />
            <span>
              {isConnected
                ? "P2P WebRTC Connected"
                : connectionState === "connecting"
                ? "Establishing P2P Mesh..."
                : `P2P State: ${connectionState}`}
            </span>
          </Badge>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Room #{session?.roomId.substring(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <InfinityIcon size={16} className="text-emerald-400" weight="bold" />
          <span>Active Indefinitely (2/2)</span>
        </div>
      </div>

      {/* Video Streams Container (Responsive 2-Person Call Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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

      {/* In-Call Controls Floating Bar */}
      <Card
        elevated
        className="p-4 bg-slate-950/80 backdrop-blur-xl border-slate-800 flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-2.5">
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
        </div>

        {/* Connection Quality & Protocol */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <WifiHigh size={16} className={isConnected ? "text-emerald-400" : "text-amber-400"} weight="bold" />
          <span>STUN Traversal: Direct P2P Media</span>
        </div>

        {/* Leave Call */}
        <Button
          variant="danger"
          size="md"
          onClick={leaveRoom}
          icon={<SignOut size={18} weight="bold" />}
        >
          Leave Call
        </Button>
      </Card>
    </div>
  );
};
