/**
 * Media device enumeration, selection, and auto-routing service
 */

export interface MediaDeviceInfoSummary {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface AvailableDevices {
  audioInputs: MediaDeviceInfoSummary[];
  audioOutputs: MediaDeviceInfoSummary[];
  videoInputs: MediaDeviceInfoSummary[];
}

export function isBluetoothOrHeadset(label: string): boolean {
  return /bluetooth|headset|airpods|buds|wireless|headphones|earphones|hands-free|hfp/i.test(
    label
  );
}

class DeviceService {
  private selectedOutputDeviceId = "";
  private deviceChangeSubscribers = new Set<(devices: AvailableDevices) => void>();
  private isListeningToDeviceChange = false;

  private handleNativeDeviceChange = async () => {
    try {
      const devices = await this.getAvailableDevices();
      this.deviceChangeSubscribers.forEach((cb) => {
        try {
          cb(devices);
        } catch (err) {
          console.error("[DeviceService] Error in devicechange subscriber:", err);
        }
      });
    } catch (err) {
      console.warn("[DeviceService] Failed to handle device change:", err);
    }
  };

  /**
   * Subscribe to hardware media device connection and disconnection events.
   * Automatically starts listening to navigator.mediaDevices 'devicechange'.
   */
  onDeviceChange(callback: (devices: AvailableDevices) => void): () => void {
    this.deviceChangeSubscribers.add(callback);

    if (!this.isListeningToDeviceChange && typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", this.handleNativeDeviceChange);
      this.isListeningToDeviceChange = true;
    }

    return () => {
      this.deviceChangeSubscribers.delete(callback);
      if (
        this.deviceChangeSubscribers.size === 0 &&
        this.isListeningToDeviceChange &&
        typeof navigator !== "undefined" &&
        navigator.mediaDevices?.removeEventListener
      ) {
        navigator.mediaDevices.removeEventListener("devicechange", this.handleNativeDeviceChange);
        this.isListeningToDeviceChange = false;
      }
    };
  }

  async getAvailableDevices(): Promise<AvailableDevices> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs: MediaDeviceInfoSummary[] = [];
      const audioOutputs: MediaDeviceInfoSummary[] = [];
      const videoInputs: MediaDeviceInfoSummary[] = [];

      devices.forEach((d, idx) => {
        const item: MediaDeviceInfoSummary = {
          deviceId: d.deviceId,
          label: d.label || `${d.kind.replace("input", " Input").replace("output", " Output")} #${idx + 1}`,
          kind: d.kind,
        };

        if (d.kind === "audioinput") audioInputs.push(item);
        else if (d.kind === "audiooutput") audioOutputs.push(item);
        else if (d.kind === "videoinput") videoInputs.push(item);
      });

      return { audioInputs, audioOutputs, videoInputs };
    } catch (err) {
      console.warn("[DeviceService] Failed to enumerate devices:", err);
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  }

  /**
   * Pick the best audio input device (prioritizing Bluetooth / Headsets, then system default)
   */
  getPreferredAudioInput(devices: MediaDeviceInfoSummary[], currentDeviceId?: string): MediaDeviceInfoSummary | undefined {
    if (!devices.length) return undefined;
    // 1. Look for Bluetooth or external headset
    const btOrHeadset = devices.find((d) => isBluetoothOrHeadset(d.label));
    if (btOrHeadset && btOrHeadset.deviceId !== currentDeviceId) {
      return btOrHeadset;
    }
    // 2. Return current or default
    return devices.find((d) => d.deviceId === currentDeviceId) || devices.find((d) => d.deviceId === "default") || devices[0];
  }

  /**
   * Pick the best audio output device (prioritizing Bluetooth / Headsets, then system default)
   */
  getPreferredAudioOutput(devices: MediaDeviceInfoSummary[], currentDeviceId?: string): MediaDeviceInfoSummary | undefined {
    if (!devices.length) return undefined;
    const btOrHeadset = devices.find((d) => isBluetoothOrHeadset(d.label));
    if (btOrHeadset && btOrHeadset.deviceId !== currentDeviceId) {
      return btOrHeadset;
    }
    return devices.find((d) => d.deviceId === currentDeviceId) || devices.find((d) => d.deviceId === "default") || devices[0];
  }

  /**
   * Set output audio sink on an HTMLMediaElement (<video> or <audio>)
   */
  async setAudioOutputSink(element: HTMLMediaElement, deviceId?: string): Promise<boolean> {
    const target = deviceId ?? this.selectedOutputDeviceId;
    if (!target || typeof (element as any).setSinkId !== "function") return false;
    try {
      await (element as any).setSinkId(target);
      return true;
    } catch (err) {
      console.warn("[DeviceService] Failed to set sinkId on media element:", err);
      return false;
    }
  }

  /**
   * Apply selected audio output device to all media elements across the DOM
   */
  async applyAudioOutput(deviceId: string): Promise<void> {
    this.selectedOutputDeviceId = deviceId;
    if (typeof document !== "undefined") {
      const mediaElements = document.querySelectorAll<HTMLMediaElement>("video, audio");
      for (const el of mediaElements) {
        await this.setAudioOutputSink(el, deviceId);
      }
    }
  }

  getSelectedAudioOutput(): string {
    return this.selectedOutputDeviceId;
  }

  /**
   * Switch active video input device on an existing MediaStream
   */
  async switchVideoDevice(
    stream: MediaStream,
    deviceId: string,
    replaceTrack: (track: MediaStreamTrack) => Promise<void>
  ): Promise<MediaStreamTrack | null> {
    let newTrack: MediaStreamTrack | undefined;
    try {
      const oldTrack = stream.getVideoTracks()[0];
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return null;
      newTrack.enabled = oldTrack?.enabled ?? true;

      // Keep the current track live until the peer accepts its replacement.
      await replaceTrack(newTrack);

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }

      stream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      newTrack?.stop();
      console.error("[DeviceService] Failed to switch video device:", err);
      return null;
    }
  }

  /**
   * Switch active audio input device on an existing MediaStream
   */
  async switchAudioDevice(
    stream: MediaStream,
    deviceId: string,
    replaceTrack: (track: MediaStreamTrack) => Promise<void>,
    noiseSuppression = true
  ): Promise<MediaStreamTrack | null> {
    let newTrack: MediaStreamTrack | undefined;
    try {
      const oldTrack = stream.getAudioTracks()[0];
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression,
          autoGainControl: true,
        },
      });
      newTrack = newStream.getAudioTracks()[0];
      if (!newTrack) return null;
      newTrack.enabled = oldTrack?.enabled ?? true;

      // Keep the current track live until the peer accepts its replacement.
      await replaceTrack(newTrack);

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }

      stream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      newTrack?.stop();
      console.error("[DeviceService] Failed to switch audio device:", err);
      return null;
    }
  }
}

export const deviceService = new DeviceService();
