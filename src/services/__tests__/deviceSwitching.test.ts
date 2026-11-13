import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deviceService,
  formatDeviceLabel,
  isBluetoothOrHeadset,
  MediaDeviceInfoSummary,
} from "../deviceService";
import { webrtcService } from "../webrtcService";

vi.mock("../signalingService", () => ({
  signalingService: { on: vi.fn() },
}));

afterEach(() => {
  webrtcService.closePeerConnection();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe.each(["audio", "video"] as const)("%s device replacement", (kind) => {
  function setup() {
    const oldTrack = { kind, enabled: false, stop: vi.fn() } as unknown as MediaStreamTrack;
    const newTrack = { kind, enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
    let tracks = [oldTrack];
    const stream = {
      getAudioTracks: () => tracks.filter((track) => track.kind === "audio"),
      getVideoTracks: () => tracks.filter((track) => track.kind === "video"),
      removeTrack: vi.fn((track) => { tracks = tracks.filter((item) => item !== track); }),
      addTrack: vi.fn((track) => { tracks.push(track); }),
    } as unknown as MediaStream;
    const sender = {
      track: oldTrack,
      replaceTrack: vi.fn(async (track: MediaStreamTrack) => { sender.track = track; }),
    };
    const pc = { getSenders: vi.fn(() => [sender]), addTransceiver: vi.fn(() => ({ sender })), close: vi.fn() };
    vi.stubGlobal("RTCPeerConnection", vi.fn(function () { return pc; }));
    vi.stubGlobal("MediaStream", vi.fn(function () { return {}; }));
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getAudioTracks: () => kind === "audio" ? [newTrack] : [],
          getVideoTracks: () => kind === "video" ? [newTrack] : [],
        }),
      },
    });
    webrtcService.initPeerConnection(false);
    const replace = (track: MediaStreamTrack) => kind === "audio"
      ? webrtcService.replaceAudioTrack(track)
      : webrtcService.replaceVideoTrack(track);
    const switchDevice = () => kind === "audio"
      ? deviceService.switchAudioDevice(stream, "new-device", replace)
      : deviceService.switchVideoDevice(stream, "new-device", replace);
    return { oldTrack, newTrack, stream, sender, pc, replace, switchDevice, getTracks: () => tracks };
  }

  it("propagates a rejected replaceTrack", async () => {
    const { newTrack, sender, replace } = setup();
    const error = new Error("Replacement requires negotiation");
    sender.replaceTrack.mockRejectedValueOnce(error);

    await expect(replace(newTrack)).rejects.toBe(error);
  });

  it("retains the old track and stops the candidate when replaceTrack rejects", async () => {
    const { oldTrack, newTrack, stream, sender, switchDevice, getTracks } = setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    sender.replaceTrack.mockRejectedValueOnce(new Error("Replacement requires negotiation"));

    await expect(switchDevice()).resolves.toBeNull();

    expect(sender.replaceTrack).toHaveBeenCalledWith(newTrack);
    expect(sender.track).toBe(oldTrack);
    expect(getTracks()).toEqual([oldTrack]);
    expect(oldTrack.stop).not.toHaveBeenCalled();
    expect(newTrack.stop).toHaveBeenCalledOnce();
    expect(stream.removeTrack).not.toHaveBeenCalled();
    expect(stream.addTrack).not.toHaveBeenCalled();
  });

  it("keeps the old track until replacement resolves, then commits the new track", async () => {
    const { oldTrack, newTrack, sender, switchDevice, getTracks } = setup();
    let resolveReplacement!: () => void;
    const replacement = new Promise<void>((resolve) => { resolveReplacement = resolve; });
    sender.replaceTrack.mockImplementationOnce(async (track) => {
      await replacement;
      sender.track = track;
    });

    const switching = switchDevice();
    await vi.waitFor(() => expect(sender.replaceTrack).toHaveBeenCalledWith(newTrack));
    expect(getTracks()).toEqual([oldTrack]);
    expect(oldTrack.stop).not.toHaveBeenCalled();
    expect(newTrack.enabled).toBe(false);

    resolveReplacement();
    await expect(switching).resolves.toBe(newTrack);
    expect(getTracks()).toEqual([newTrack]);
    expect(sender.track).toBe(newTrack);
    expect(oldTrack.stop).toHaveBeenCalledOnce();
    expect(newTrack.stop).not.toHaveBeenCalled();
  });

  it("rejects a replacement when an active connection has no matching sender", async () => {
    const { newTrack, pc, replace } = setup();
    pc.getSenders.mockReturnValue([]);

    await expect(replace(newTrack)).rejects.toThrow(`No ${kind} sender`);
  });

  it("allows switching local devices before a peer connection exists", async () => {
    const { oldTrack, newTrack, sender, switchDevice, getTracks } = setup();
    webrtcService.closePeerConnection();

    await expect(switchDevice()).resolves.toBe(newTrack);
    expect(getTracks()).toEqual([newTrack]);
    expect(oldTrack.stop).toHaveBeenCalledOnce();
    expect(sender.replaceTrack).not.toHaveBeenCalled();
  });
});

describe("Bluetooth and headset auto detection and routing", () => {
  it("correctly identifies Bluetooth and headset labels", () => {
    expect(isBluetoothOrHeadset("AirPods Pro")).toBe(true);
    expect(isBluetoothOrHeadset("Galaxy Buds2 Pro")).toBe(true);
    expect(isBluetoothOrHeadset("Sony WH-1000XM4 Headset")).toBe(true);
    expect(isBluetoothOrHeadset("Wireless Headphones")).toBe(true);
    expect(isBluetoothOrHeadset("Jabra Hands-Free AG Audio")).toBe(true);
    expect(isBluetoothOrHeadset("USB Audio Headset")).toBe(true);
    expect(isBluetoothOrHeadset("Built-in Microphone")).toBe(false);
    expect(isBluetoothOrHeadset("Realtek High Definition Audio")).toBe(false);
  });

  it("prioritizes Bluetooth device over default in getPreferredAudioInput", () => {
    const devices: MediaDeviceInfoSummary[] = [
      { deviceId: "default", label: "Default - Internal Mic", kind: "audioinput" },
      { deviceId: "bt-1", label: "AirPods Pro Hands-Free", kind: "audioinput" },
      { deviceId: "mic-1", label: "Built-in Microphone", kind: "audioinput" },
    ];

    const preferred = deviceService.getPreferredAudioInput(devices, "default");
    expect(preferred?.deviceId).toBe("bt-1");

    // When already using Bluetooth, maintains it
    const maintained = deviceService.getPreferredAudioInput(devices, "bt-1");
    expect(maintained?.deviceId).toBe("bt-1");
  });

  it("falls back to default/first device when no Bluetooth device is found", () => {
    const devices: MediaDeviceInfoSummary[] = [
      { deviceId: "mic-1", label: "Internal Mic", kind: "audioinput" },
      { deviceId: "mic-2", label: "Webcam Mic", kind: "audioinput" },
    ];

    const preferred = deviceService.getPreferredAudioInput(devices);
    expect(preferred?.deviceId).toBe("mic-1");
  });

  it("prioritizes Bluetooth device over default in getPreferredAudioOutput", () => {
    const devices: MediaDeviceInfoSummary[] = [
      { deviceId: "default", label: "Default - Speakers", kind: "audiooutput" },
      { deviceId: "bt-out-1", label: "Galaxy Buds2 Stereo", kind: "audiooutput" },
      { deviceId: "spk-1", label: "Built-in Speakers", kind: "audiooutput" },
    ];

    const preferred = deviceService.getPreferredAudioOutput(devices, "default");
    expect(preferred?.deviceId).toBe("bt-out-1");
  });

  it("manages HTMLMediaElement setSinkId in setAudioOutputSink", async () => {
    const mockElement = {
      setSinkId: vi.fn().mockResolvedValue(undefined),
    } as unknown as HTMLMediaElement;

    const success = await deviceService.setAudioOutputSink(mockElement, "test-device-id");
    expect(success).toBe(true);
    expect(mockElement.setSinkId).toHaveBeenCalledWith("test-device-id");
  });

  it("gracefully returns false when setSinkId is not supported", async () => {
    const mockElement = {} as HTMLMediaElement;
    const success = await deviceService.setAudioOutputSink(mockElement, "test-device-id");
    expect(success).toBe(false);
  });

  it("subscribes to devicechange and unregisters when unsubscribed", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal("navigator", {
      mediaDevices: {
        addEventListener,
        removeEventListener,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const callback = vi.fn();
    const unsubscribe = deviceService.onDeviceChange(callback);

    expect(addEventListener).toHaveBeenCalledWith("devicechange", expect.any(Function));

    unsubscribe();
    expect(removeEventListener).toHaveBeenCalledWith("devicechange", expect.any(Function));
  });
});

describe("Device label formatting and typography normalization", () => {
  it("normalizes raw Android Camera HAL labels", () => {
    expect(formatDeviceLabel("camera 1, facing front", "videoinput", 0)).toBe(
      "Front Camera (Camera 1)"
    );
    expect(formatDeviceLabel("camera 0, facing back", "videoinput", 1)).toBe(
      "Back Camera (Camera 0)"
    );
    expect(formatDeviceLabel("camera 2, facing back", "videoinput", 2)).toBe(
      "Back Camera (Camera 2)"
    );
    expect(formatDeviceLabel("facing front", "videoinput", 0)).toBe("Front Camera");
    expect(formatDeviceLabel("facing back", "videoinput", 1)).toBe("Back Camera");
    expect(formatDeviceLabel("camera 0", "videoinput", 0)).toBe("Camera 0");
  });

  it("normalizes awkward lower-case fallback labels with numbers", () => {
    expect(formatDeviceLabel(" audio Output #7", "audiooutput", 6)).toBe(
      "Speaker / Headset 7"
    );
    expect(formatDeviceLabel("audio Input #1", "audioinput", 0)).toBe("Microphone 1");
    expect(formatDeviceLabel("video input #2", "videoinput", 1)).toBe("Camera 2");
  });

  it("generates clean titled fallbacks when labels are empty or whitespace", () => {
    expect(formatDeviceLabel("", "audioinput", 0)).toBe("Microphone 1");
    expect(formatDeviceLabel(undefined, "audioinput", 1)).toBe("Microphone 2");
    expect(formatDeviceLabel("   ", "audiooutput", 0)).toBe("Speaker / Headset 1");
    expect(formatDeviceLabel("", "videoinput", 0)).toBe("Camera 1");
  });

  it("normalizes system default keywords", () => {
    expect(formatDeviceLabel("default", "audioinput", 0)).toBe("Default Microphone");
    expect(formatDeviceLabel("default", "audiooutput", 0)).toBe("Default Speaker / Headset");
    expect(formatDeviceLabel("communications", "audioinput", 0)).toBe(
      "Communications Microphone"
    );
    expect(formatDeviceLabel("communications", "audiooutput", 0)).toBe(
      "Communications Speaker"
    );
  });

  it("converts all-lowercase accessory labels to Title Case", () => {
    expect(formatDeviceLabel("wired headset", "audioinput", 0)).toBe("Wired Headset");
    expect(formatDeviceLabel("bluetooth headphones", "audiooutput", 0)).toBe(
      "Bluetooth Headphones"
    );
  });

  it("formats enumerated devices in getAvailableDevices with category-specific indices", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: "cam-front", label: "camera 1, facing front", kind: "videoinput" },
          { deviceId: "cam-back", label: "camera 0, facing back", kind: "videoinput" },
          { deviceId: "mic-raw", label: "audio Input #1", kind: "audioinput" },
          { deviceId: "spk-raw", label: " audio Output #7", kind: "audiooutput" },
        ]),
      },
    });

    const res = await deviceService.getAvailableDevices();

    expect(res.videoInputs).toEqual([
      { deviceId: "cam-front", label: "Front Camera (Camera 1)", kind: "videoinput" },
      { deviceId: "cam-back", label: "Back Camera (Camera 0)", kind: "videoinput" },
    ]);
    expect(res.audioInputs).toEqual([
      { deviceId: "mic-raw", label: "Microphone 1", kind: "audioinput" },
    ]);
    expect(res.audioOutputs).toEqual([
      { deviceId: "spk-raw", label: "Speaker / Headset 7", kind: "audiooutput" },
    ]);
  });
});

describe("Mobile / Android video hardware lock release and fallback", () => {
  it("releases locked camera and switches to target camera on NotReadableError", async () => {
    const oldTrack = {
      kind: "video",
      enabled: true,
      stop: vi.fn(),
      getSettings: () => ({ deviceId: "cam-front-id" }),
    } as unknown as MediaStreamTrack;

    const newTrack = {
      kind: "video",
      enabled: true,
      stop: vi.fn(),
      getSettings: () => ({ deviceId: "cam-back-id" }),
    } as unknown as MediaStreamTrack;

    let tracks = [oldTrack];
    const stream = {
      getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
      removeTrack: vi.fn((t) => {
        tracks = tracks.filter((item) => item !== t);
      }),
      addTrack: vi.fn((t) => {
        tracks.push(t);
      }),
    } as unknown as MediaStream;

    const replaceTrack = vi.fn().mockResolvedValue(undefined);

    // First call (concurrent) fails with NotReadableError (hardware lock)
    // Second call (after releasing old track) succeeds with newTrack
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(new Error("NotReadableError: Could not start video source"))
      .mockResolvedValueOnce({
        getVideoTracks: () => [newTrack],
      });

    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    const switched = await deviceService.switchVideoDevice(
      stream,
      "cam-back-id",
      replaceTrack
    );

    expect(switched).toBe(newTrack);
    expect(oldTrack.stop).toHaveBeenCalledOnce();
    expect(stream.removeTrack).toHaveBeenCalledWith(oldTrack);
    expect(replaceTrack).toHaveBeenCalledWith(newTrack);
    expect(stream.addTrack).toHaveBeenCalledWith(newTrack);
    expect(tracks).toEqual([newTrack]);
  });

  it("attempts rollback to previous camera if target camera acquisition completely fails", async () => {
    const oldTrack = {
      kind: "video",
      enabled: true,
      stop: vi.fn(),
      getSettings: () => ({ deviceId: "cam-front-id" }),
    } as unknown as MediaStreamTrack;

    const rollbackTrack = {
      kind: "video",
      enabled: true,
      stop: vi.fn(),
      getSettings: () => ({ deviceId: "cam-front-id" }),
    } as unknown as MediaStreamTrack;

    let tracks = [oldTrack];
    const stream = {
      getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
      removeTrack: vi.fn((t) => {
        tracks = tracks.filter((item) => item !== t);
      }),
      addTrack: vi.fn((t) => {
        tracks.push(t);
      }),
    } as unknown as MediaStream;

    const replaceTrack = vi.fn().mockResolvedValue(undefined);

    // Call 1 (concurrent) fails
    // Call 2 (exact target) fails
    // Call 3 (ideal target) fails
    // Call 4 (rollback) succeeds
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(new Error("NotReadableError"))
      .mockRejectedValueOnce(new Error("Target device unavailable"))
      .mockRejectedValueOnce(new Error("Target device ideal unavailable"))
      .mockResolvedValueOnce({
        getVideoTracks: () => [rollbackTrack],
      });

    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    const result = await deviceService.switchVideoDevice(
      stream,
      "cam-broken-id",
      replaceTrack
    );

    expect(result).toBeNull();
    expect(oldTrack.stop).toHaveBeenCalledOnce();
    expect(replaceTrack).toHaveBeenCalledWith(rollbackTrack);
    expect(stream.addTrack).toHaveBeenCalledWith(rollbackTrack);
    expect(tracks).toEqual([rollbackTrack]);
  });
});
