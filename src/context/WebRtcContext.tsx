import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { webrtcService, PeerConnectionState } from "@/services/webrtcService";
import { notifyNativeCallState } from "@/services/androidPipService";
import { useRoom } from "./RoomContext";

interface WebRtcContextValue {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  connectionState: PeerConnectionState;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isNoiseSuppressionEnabled: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  setNoiseSuppression: (enabled: boolean) => Promise<boolean>;
}

const WebRtcContext = createContext<WebRtcContextValue | null>(null);

export const WebRtcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status } = useRoom();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>("new");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(
    webrtcService.isNoiseSuppressionEnabled()
  );
  const wasActiveRef = useRef(false);
  const connStateRef = useRef<PeerConnectionState>("new");

  useEffect(() => {
    const unsubLocal = webrtcService.on("local_stream", (stream: MediaStream) => {
      setLocalStream(stream);
    });

    const unsubRemote = webrtcService.on("remote_stream", (stream: MediaStream) => {
      // Clone MediaStream reference so React re-renders when the 2nd track (audio + video) is added
      setRemoteStream(stream ? new MediaStream(stream.getTracks()) : null);
    });

    const unsubConn = webrtcService.on("connection_state", (state: PeerConnectionState) => {
      connStateRef.current = state;
      setConnectionState(state);
    });

    const unsubMediaState = webrtcService.on("media_state", (state: { isMuted: boolean; isCameraOff: boolean }) => {
      setIsMuted(state.isMuted);
      setIsCameraOff(state.isCameraOff);
    });

    const unsubScreenShare = webrtcService.on("screen_share_change", (data: { isSharing: boolean; stream: MediaStream | null }) => {
      setIsScreenSharing(data.isSharing);
      setScreenStream(data.stream);
    });

    const unsubAudioProcessing = webrtcService.on("audio_processing_change", (data: { noiseSuppression: boolean }) => {
      setIsNoiseSuppressionEnabled(data.noiseSuppression);
    });

    return () => {
      unsubLocal();
      unsubRemote();
      unsubConn();
      unsubMediaState();
      unsubScreenShare();
      unsubAudioProcessing();
    };
  }, []);

  // When room status transitions to 'active', acquire local media and initialize peer connection
  useEffect(() => {
    let cancelled = false;
    let offerTimeout: ReturnType<typeof setTimeout> | undefined;
    let retryOfferTimeout: ReturnType<typeof setTimeout> | undefined;

    if (status === "active" && session) {
      wasActiveRef.current = true;
      const isHost = session.myRole === "host";

      // Wire signaling BEFORE getUserMedia so early offers/candidates are buffered
      webrtcService.prepareSignaling(isHost);

      webrtcService.startLocalMedia(true, true).then(() => {
        if (cancelled) return;
        notifyNativeCallState(true);
        webrtcService.initPeerConnection(isHost);

        if (isHost) {
          offerTimeout = setTimeout(() => {
            if (!cancelled) webrtcService.createAndSendOffer();
          }, 600);

          // Retry offer if Guest was still on the Android permission prompt
          retryOfferTimeout = setTimeout(() => {
            if (
              !cancelled &&
              connStateRef.current !== "connected" &&
              connStateRef.current !== "connecting"
            ) {
              webrtcService.createAndSendOffer();
            }
          }, 3000);
        }
      });
    } else if (status !== "active" && wasActiveRef.current) {
      wasActiveRef.current = false;
      notifyNativeCallState(false);
      webrtcService.stopAllMedia();
      setLocalStream(null);
      setRemoteStream(null);
      setScreenStream(null);
      setIsScreenSharing(false);
      connStateRef.current = "new";
      setConnectionState("new");
    }

    return () => {
      cancelled = true;
      if (offerTimeout !== undefined) clearTimeout(offerTimeout);
      if (retryOfferTimeout !== undefined) clearTimeout(retryOfferTimeout);
    };
  }, [status, session?.roomId, session?.myRole]);

  // Clean up when provider completely unmounts
  useEffect(() => {
    return () => {
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        notifyNativeCallState(false);
        webrtcService.stopAllMedia();
      }
    };
  }, []);

  const toggleMic = () => {
    setIsMuted(webrtcService.toggleMicrophone());
  };

  const toggleCamera = () => {
    setIsCameraOff(webrtcService.toggleCamera());
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await webrtcService.stopScreenShare();
    } else {
      await webrtcService.startScreenShare();
    }
  };

  const setNoiseSuppression = async (enabled: boolean) => {
    const updated = await webrtcService.setNoiseSuppression(enabled);
    setIsNoiseSuppressionEnabled(updated);
    return updated;
  };

  return (
    <WebRtcContext.Provider
      value={{
        localStream,
        remoteStream,
        screenStream,
        connectionState,
        isMuted,
        isCameraOff,
        isScreenSharing,
        isNoiseSuppressionEnabled,
        toggleMic,
        toggleCamera,
        toggleScreenShare,
        setNoiseSuppression,
      }}
    >
      {children}
    </WebRtcContext.Provider>
  );
};

export const useWebRtc = (): WebRtcContextValue => {
  const ctx = useContext(WebRtcContext);
  if (!ctx) {
    throw new Error("useWebRtc must be used within a WebRtcProvider");
  }
  return ctx;
};