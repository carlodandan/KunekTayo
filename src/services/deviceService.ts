/**
 * Media device enumeration and selection service
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

class DeviceService {
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
        const item = {
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
      console.warn("Failed to enumerate devices:", err);
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  }

  /**
   * Switch active video input device on an existing MediaStream
   */
  async switchVideoDevice(stream: MediaStream, deviceId: string): Promise<MediaStreamTrack | null> {
    try {
      const oldTrack = stream.getVideoTracks()[0];
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }

      stream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      console.error("Failed to switch video device:", err);
      return null;
    }
  }

  /**
   * Switch active audio input device on an existing MediaStream
   */
  async switchAudioDevice(stream: MediaStream, deviceId: string): Promise<MediaStreamTrack | null> {
    try {
      const oldTrack = stream.getAudioTracks()[0];
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getAudioTracks()[0];

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }

      stream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      console.error("Failed to switch audio device:", err);
      return null;
    }
  }
}

export const deviceService = new DeviceService();
