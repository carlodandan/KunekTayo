import React, { createContext, useContext, useState, useEffect } from "react";
import { webrtcService, PeerConnectionState } from "@/services/webrtcService";
import { useRoom } from "./RoomContext";

interface WebRtcContextValue {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  connectionState: PeerConnectionState;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
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

  useEffect(() => {
    const unsubLocal = webrtcService.on("local_stream", (stream: MediaStream) => {
      setLocalStream(stream);
    });

    const unsubRemote = webrtcService.on("remote_stream", (stream: MediaStream) => {
      setRemoteStream(stream);
    });

    const unsubConn = webrtcService.on("connection_state", (state: PeerConnectionState) => {
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

    return () => {
      unsubLocal();
      unsubRemote();
      unsubConn();
      unsubMediaState();
      unsubScreenShare();
    };
  }, []);

  // When room status transitions to 'active', acquire local media and initialize peer connection
  useEffect(() => {
    if (status === "active" && session) {
      const isHost = session.myRole === "host";

      webrtcService.startLocalMedia(true, true).then((stream) => {
        if (stream) {
          webrtcService.initPeerConnection(isHost);
          if (isHost) {
            // Give brief moment for peer connection ready, then offer
            setTimeout(() => {
              webrtcService.createAndSendOffer();
            }, 600);
          }
        }
      });
    } else if (status !== "active") {
      webrtcService.stopAllMedia();
      setLocalStream(null);
      setRemoteStream(null);
      setScreenStream(null);
      setIsScreenSharing(false);
      setConnectionState("new");
    }
  }, [status, session?.roomId, session?.myRole]);

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
        toggleMic,
        toggleCamera,
        toggleScreenShare,
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
