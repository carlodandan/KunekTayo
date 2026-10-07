import React, { useEffect, useState } from "react";
import {
  X,
  Microphone,
  VideoCamera,
  SpeakerHigh,
  GearSix,
  Check,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { deviceService, AvailableDevices } from "@/services/deviceService";
import { useWebRtc } from "@/context/WebRtcContext";

export interface DeviceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { localStream } = useWebRtc();
  const [devices, setDevices] = useState<AvailableDevices>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    deviceService.getAvailableDevices().then((res) => {
      setDevices(res);
      if (res.audioInputs[0] && !selectedAudioInput) {
        setSelectedAudioInput(res.audioInputs[0].deviceId);
      }
      if (res.videoInputs[0] && !selectedVideoInput) {
        setSelectedVideoInput(res.videoInputs[0].deviceId);
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (localStream) {
      if (selectedVideoInput) {
        await deviceService.switchVideoDevice(localStream, selectedVideoInput);
      }
      if (selectedAudioInput) {
        await deviceService.switchAudioDevice(localStream, selectedAudioInput);
      }
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <Card
        elevated
        className="w-full max-w-md bg-slate-900 border-slate-700 p-6 text-left space-y-5 relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <GearSix size={22} weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Audio & Video Settings
            </h3>
            <p className="text-xs text-slate-400">
              Select connected devices for your call
            </p>
          </div>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Microphone size={14} className="text-blue-400" />
            <span>Microphone</span>
          </label>
          <select
            value={selectedAudioInput}
            onChange={(e) => setSelectedAudioInput(e.target.value)}
            className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs sm:text-sm text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
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

        {/* Camera Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <VideoCamera size={14} className="text-cyan-400" />
            <span>Camera</span>
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => setSelectedVideoInput(e.target.value)}
            className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs sm:text-sm text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <SpeakerHigh size={14} className="text-emerald-400" />
              <span>Speaker</span>
            </label>
            <select className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs sm:text-sm text-slate-200 focus:border-blue-500 focus:outline-none transition-colors">
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
            className="text-slate-400 hover:text-white"
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
