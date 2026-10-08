import React, { useEffect, useState } from "react";
import {
  X,
  Microphone,
  VideoCamera,
  SpeakerHigh,
  GearSix,
  Check,
  Waveform,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { deviceService, AvailableDevices } from "@/services/deviceService";
import { webrtcService } from "@/services/webrtcService";
import { useWebRtc } from "@/context/WebRtcContext";
import { cn } from "@/utils/cn";

export interface DeviceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { localStream, isNoiseSuppressionEnabled, setNoiseSuppression } = useWebRtc();
  const [devices, setDevices] = useState<AvailableDevices>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [noiseSuppression, setNoiseSuppressionLocal] = useState(isNoiseSuppressionEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setNoiseSuppressionLocal(isNoiseSuppressionEnabled);

    deviceService.getAvailableDevices().then((res) => {
      setDevices(res);
      if (res.audioInputs[0] && !selectedAudioInput) {
        setSelectedAudioInput(res.audioInputs[0].deviceId);
      }
      if (res.videoInputs[0] && !selectedVideoInput) {
        setSelectedVideoInput(res.videoInputs[0].deviceId);
      }
    });
  }, [isOpen, isNoiseSuppressionEnabled]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (noiseSuppression !== isNoiseSuppressionEnabled) {
      await setNoiseSuppression(noiseSuppression);
    }
    if (localStream) {
      if (selectedVideoInput) {
        const newVideoTrack = await deviceService.switchVideoDevice(
          localStream,
          selectedVideoInput,
          (track) => webrtcService.replaceVideoTrack(track)
        );
        if (!newVideoTrack) return;
      }
      if (selectedAudioInput) {
        const newAudioTrack = await deviceService.switchAudioDevice(
          localStream,
          selectedAudioInput,
          (track) => webrtcService.replaceAudioTrack(track),
          noiseSuppression
        );
        if (!newAudioTrack) return;
      }
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <Card
        elevated
        className="w-full max-w-md bg-[#2b2d31] border-[#35373c] p-5 sm:p-6 text-left space-y-4 sm:space-y-5 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#949ba4] hover:text-[#f2f3f5] p-1 rounded-lg hover:bg-[#35373c] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#9098C8]">
            <GearSix size={22} weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f2f3f5] tracking-tight">
              Audio & Video Settings
            </h3>
            <p className="text-xs text-[#949ba4]">
              Select connected devices for your call
            </p>
          </div>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#dbdee1] flex items-center gap-1.5">
            <Microphone size={14} className="text-[#9098C8]" />
            <span>Microphone</span>
          </label>
          <select
            value={selectedAudioInput}
            onChange={(e) => setSelectedAudioInput(e.target.value)}
            className="w-full h-11 bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 text-xs sm:text-sm text-[#f2f3f5] focus:border-[#283E7C] focus:outline-none transition-colors"
          >
            {devices.audioInputs.length === 0 ? (
              <option value="">Default Microphone</option>
            ) : (
              devices.audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Noise Suppression Toggle */}
        <div className="bg-[#1e1f22] border border-[#35373c] rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2b2d31] flex items-center justify-center text-[#9098C8] shrink-0">
              <Waveform size={18} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#f2f3f5]">
                Noise Suppression
              </p>
              <p className="text-[11px] text-[#949ba4]">
                Filter background keyboard, fan, and room echo
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={noiseSuppression}
            onClick={() => setNoiseSuppressionLocal(!noiseSuppression)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#283E7C]",
              noiseSuppression ? "bg-[#283E7C]" : "bg-[#4e5058]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                noiseSuppression ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Camera Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#dbdee1] flex items-center gap-1.5">
            <VideoCamera size={14} className="text-[#9098C8]" />
            <span>Camera</span>
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => setSelectedVideoInput(e.target.value)}
            className="w-full h-11 bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 text-xs sm:text-sm text-[#f2f3f5] focus:border-[#283E7C] focus:outline-none transition-colors"
          >
            {devices.videoInputs.length === 0 ? (
              <option value="">Default Camera</option>
            ) : (
              devices.videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Speaker / Output (if supported) */}
        {devices.audioOutputs.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#dbdee1] flex items-center gap-1.5">
              <SpeakerHigh size={14} className="text-[#9098C8]" />
              <span>Speaker</span>
            </label>
            <select className="w-full h-11 bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 text-xs sm:text-sm text-[#f2f3f5] focus:border-[#283E7C] focus:outline-none transition-colors">
              {devices.audioOutputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-3 flex items-center justify-end gap-2.5">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="text-[#949ba4] hover:text-[#f2f3f5]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            icon={savedSuccess ? <Check size={16} weight="bold" /> : undefined}
          >
            {savedSuccess ? "Applied!" : "Apply Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
