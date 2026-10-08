import React, { useEffect, useRef } from "react";
import { User, VideoCameraSlash, MicrophoneSlash } from "@phosphor-icons/react";
import { cn } from "@/utils/cn";

export interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  isPip?: boolean;
  className?: string;
  onClick?: () => void;
  videoRef?: React.Ref<HTMLVideoElement>;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      stream,
      label,
      isMuted = false,
      isVideoOff = false,
      isLocal = false,
      isPip = false,
      className,
      onClick,
      videoRef: customVideoRef,
    },
    ref
  ) => {
    const internalVideoRef = useRef<HTMLVideoElement>(null);

    const setVideoRef = (node: HTMLVideoElement | null) => {
      internalVideoRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      }

      if (typeof customVideoRef === "function") {
        customVideoRef(node);
      } else if (customVideoRef && "current" in customVideoRef) {
        (customVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      }
    };

    useEffect(() => {
      if (internalVideoRef.current) {
        if (stream) {
          internalVideoRef.current.srcObject = stream;
        } else {
          internalVideoRef.current.srcObject = null;
        }
      }
    }, [stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full h-full bg-[#1e1f22] rounded-2xl overflow-hidden border border-[#35373c] flex items-center justify-center select-none transition-colors duration-200",
        !isPip && "min-h-[200px] sm:min-h-[280px]",
        isPip && "min-h-0 cursor-pointer hover:border-[#5865f2]",
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={setVideoRef}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center space-y-1.5 bg-[#2b2d31]">
          <div
            className={cn(
              "rounded-full bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#949ba4]",
              isPip ? "w-8 h-8 sm:w-10 sm:h-10" : "w-16 h-16 sm:w-20 sm:h-20"
            )}
          >
            <User size={isPip ? 18 : 36} weight="bold" />
          </div>
          {!isPip && (
            <div className="flex items-center gap-1.5 text-xs text-[#949ba4]">
              <VideoCameraSlash size={14} className="text-[#da373c]" />
              <span>Camera Off</span>
            </div>
          )}
        </div>
      )}

      {/* Label and Status Badges */}
      <div className={cn("absolute flex items-center gap-1.5 z-10", isPip ? "top-1.5 left-1.5" : "top-3 left-3")}>
        <span
          className={cn(
            "rounded-md bg-[#1e1f22]/90 font-medium text-[#f2f3f5] border border-[#35373c]",
            isPip ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2.5 py-1"
          )}
        >
          {label}
        </span>
      </div>

      <div className={cn("absolute flex items-center gap-1.5 z-10", isPip ? "bottom-1.5 right-1.5" : "bottom-3 right-3")}>
        {isMuted && (
          <span
            className={cn(
              "rounded-md bg-[#da373c] text-white flex items-center justify-center",
              isPip ? "p-1" : "p-1.5"
            )}
          >
            <MicrophoneSlash size={isPip ? 10 : 14} weight="bold" />
          </span>
        )}
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
