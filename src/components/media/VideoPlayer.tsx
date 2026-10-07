import React, { useEffect, useRef } from "react";
import { User, VideoCameraSlash, MicrophoneSlash } from "@phosphor-icons/react";
import { cn } from "@/utils/cn";

export interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  label,
  isMuted = false,
  isVideoOff = false,
  isLocal = false,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[220px] sm:min-h-[280px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none shadow-lg",
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Local video must always be muted to prevent acoustic feedback
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          isLocal && "scale-x-[-1]", // Mirror local webcam preview
          !hasVideoTrack && "opacity-0"
        )}
      />

      {/* Avatar Placeholder when video is off or absent */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <User size={36} weight="bold" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <VideoCameraSlash size={14} className="text-red-400" />
            <span>Camera Off</span>
          </div>
        </div>
      )}

      {/* Label and Status Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
          {label}
        </span>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
        {isMuted && (
          <span className="p-1.5 rounded-lg bg-red-600/80 backdrop-blur-md text-white border border-red-500/30">
            <MicrophoneSlash size={14} weight="bold" />
          </span>
        )}
      </div>
    </div>
  );
};
