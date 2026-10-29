import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { webrtcService, PeerConnectionState } from "@/services/webrtcService";
import { notifyNativeCallState } from "@/services/androidPipService";
import { deviceService, isBluetoothOrHeadset } from "@/services/deviceService";
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
        if (cancelled) {
          webrtcService.stopAllMedia();
          return;
        }
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

  // Auto-detect and route Bluetooth or external headset devices (or fallback if disconnected)
  useEffect(() => {
    if (status !== "active" || !localStream) return;

    let isEffectActive = true;

    // 1. Initial check when stream is acquired: if a Bluetooth device is connected, prefer it
    deviceService
      .getAvailableDevices()
      .then(async ({ audioInputs, audioOutputs }) => {
        if (!isEffectActive || !localStream) return;
        const currentTrack = localStream.getAudioTracks()[0];
        const currentDeviceId = currentTrack?.getSettings()?.deviceId;
        const preferredInput = deviceService.getPreferredAudioInput(audioInputs, currentDeviceId);

        if (
          preferredInput &&
          isBluetoothOrHeadset(preferredInput.label) &&
          preferredInput.deviceId !== currentDeviceId
        ) {
          console.log(
            "[WebRtcContext] Auto-selecting initial headset/Bluetooth microphone:",
            preferredInput.label
          );
          await deviceService.switchAudioDevice(
            localStream,
            preferredInput.deviceId,
            (newTrack) => webrtcService.replaceAudioTrack(newTrack),
            isNoiseSuppressionEnabled
          );
        }

        const currentOutputId = deviceService.getSelectedAudioOutput();
        const preferredOutput = deviceService.getPreferredAudioOutput(audioOutputs, currentOutputId);
        if (preferredOutput && (isBluetoothOrHeadset(preferredOutput.label) || !currentOutputId)) {
          await deviceService.applyAudioOutput(preferredOutput.deviceId);
        }
      })
      .catch((err) => {
        console.warn("[WebRtcContext] Initial device detection failed:", err);
      });

    // 2. Track ended listener (e.g. Bluetooth device disconnected / turned off mid-call)
    const audioTrack = localStream.getAudioTracks()[0];
    const handleTrackEnded = async () => {
      if (!isEffectActive) return;
      console.warn("[WebRtcContext] Active audio track ended unexpectedly. Attempting fallback...");
      try {
        const { audioInputs } = await deviceService.getAvailableDevices();
        const currentId = audioTrack?.getSettings()?.deviceId;
        const fallback =
          audioInputs.find((d) => d.deviceId && d.deviceId !== currentId) || audioInputs[0];
        if (fallback && localStream) {
          await deviceService.switchAudioDevice(
            localStream,
            fallback.deviceId,
            (newTrack) => webrtcService.replaceAudioTrack(newTrack),
            isNoiseSuppressionEnabled
          );
        }
      } catch (err) {
        console.error("[WebRtcContext] Failed to recover audio track on ended:", err);
      }
    };

    if (audioTrack) {
      audioTrack.addEventListener("ended", handleTrackEnded);
    }

    // 3. Dynamic device change listener (user plugs in or connects Bluetooth headphones during call)
    const unsubscribeDeviceChange = deviceService.onDeviceChange(
      async ({ audioInputs, audioOutputs }) => {
        if (!isEffectActive || !localStream) return;

        const currentTrack = localStream.getAudioTracks()[0];
        const currentDeviceId = currentTrack?.getSettings()?.deviceId;
        const preferredInput = deviceService.getPreferredAudioInput(audioInputs, currentDeviceId);

        if (
          preferredInput &&
          isBluetoothOrHeadset(preferredInput.label) &&
          preferredInput.deviceId !== currentDeviceId
        ) {
          console.log(
            "[WebRtcContext] Auto-switching to preferred headset/Bluetooth microphone:",
            preferredInput.label
          );
          await deviceService.switchAudioDevice(
            localStream,
            preferredInput.deviceId,
            (newTrack) => webrtcService.replaceAudioTrack(newTrack),
            isNoiseSuppressionEnabled
          );
        }

        const currentOutputId = deviceService.getSelectedAudioOutput();
        const preferredOutput = deviceService.getPreferredAudioOutput(audioOutputs, currentOutputId);
        if (
          preferredOutput &&
          isBluetoothOrHeadset(preferredOutput.label) &&
          preferredOutput.deviceId !== currentOutputId
        ) {
          console.log(
            "[WebRtcContext] Auto-switching to preferred headset/Bluetooth output:",
            preferredOutput.label
          );
          await deviceService.applyAudioOutput(preferredOutput.deviceId);
        }
      }
    );

    return () => {
      isEffectActive = false;
      if (audioTrack) {
        audioTrack.removeEventListener("ended", handleTrackEnded);
      }
      unsubscribeDeviceChange();
    };
  }, [status, localStream, isNoiseSuppressionEnabled]);

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