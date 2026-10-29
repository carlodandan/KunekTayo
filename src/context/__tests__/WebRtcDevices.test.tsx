import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WebRtcProvider } from "../WebRtcContext";
import { deviceService, type AvailableDevices } from "@/services/deviceService";
import { webrtcService } from "@/services/webrtcService";

const state = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
  stateIndex: 0,
  stream: null as MediaStream | null,
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) => react.useState(state.stateIndex++ === 0 ? state.stream : initial),
    useEffect: (effect: () => void | (() => void)) => state.effects.push(effect),
  };
});
vi.mock("../RoomContext", () => ({ useRoom: () => ({ status: "active", session: null }) }));
vi.mock("@/services/webrtcService", () => ({ webrtcService: {
  isNoiseSuppressionEnabled: () => true,
  replaceAudioTrack: vi.fn().mockResolvedValue(undefined),
} }));

function track(deviceId: string) {
  return Object.assign(new EventTarget(), {
    kind: "audio", enabled: true, stop: vi.fn(), getSettings: () => ({ deviceId }),
  }) as unknown as MediaStreamTrack;
}

const internalDevices: AvailableDevices = {
  audioInputs: [{ deviceId: "internal-mic", label: "Built-in Microphone", kind: "audioinput" }],
  audioOutputs: [{ deviceId: "speakers", label: "Built-in Speakers", kind: "audiooutput" }],
  videoInputs: [],
};
function withHeadset(id: string, devices = internalDevices): AvailableDevices {
  return {
    ...devices,
    audioInputs: [...devices.audioInputs, { deviceId: `${id}-mic`, label: "Bluetooth Headset", kind: "audioinput" }],
    audioOutputs: [...devices.audioOutputs, { deviceId: `${id}-out`, label: "Bluetooth Headset", kind: "audiooutput" }],
  };
}

let devices: AvailableDevices;
let deviceChange: (devices: AvailableDevices) => void;
let cleanup: () => void;
let currentTrack: MediaStreamTrack;
let getUserMedia: ReturnType<typeof vi.fn>;

async function startEffect() {
  state.effects.length = 0;
  state.stateIndex = 0;
  renderToStaticMarkup(<WebRtcProvider>{null}</WebRtcProvider>);
  cleanup = state.effects[3]() as () => void;
  await Promise.resolve();
}

beforeEach(() => {
  devices = withHeadset("existing");
  currentTrack = track("internal-mic");
  state.stream = {
    getAudioTracks: () => currentTrack ? [currentTrack] : [],
    removeTrack: () => {},
    addTrack: (next: MediaStreamTrack) => { currentTrack = next; },
  } as unknown as MediaStream;
  getUserMedia = vi.fn(async ({ audio }) => {
    const next = track(audio.deviceId.exact);
    return { getAudioTracks: () => [next] };
  });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.spyOn(deviceService, "getAvailableDevices").mockImplementation(async () => devices);
  vi.spyOn(deviceService, "getSelectedAudioOutput").mockReturnValue("speakers");
  vi.spyOn(deviceService, "applyAudioOutput").mockResolvedValue(undefined);
  vi.spyOn(deviceService, "onDeviceChange").mockImplementation((callback) => {
    deviceChange = callback;
    return vi.fn();
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  cleanup?.();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("automatic audio device routing", () => {
  it("preserves manual selections on initial checks, unrelated changes, and effect reruns", async () => {
    await startEffect();
    await deviceChange(devices);
    await deviceChange({ ...devices, videoInputs: [{ deviceId: "camera", label: "Camera", kind: "videoinput" }] });
    cleanup();
    await startEffect();
    await deviceChange(devices);

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(deviceService.applyAudioOutput).not.toHaveBeenCalled();
    expect(currentTrack.getSettings().deviceId).toBe("internal-mic");
  });

  it("routes to newly added headsets even when an existing headset is preferred", async () => {
    await startEffect();
    devices = withHeadset("new", devices);
    await deviceChange(devices);

    expect(currentTrack.getSettings().deviceId).toBe("new-mic");
    expect(webrtcService.replaceAudioTrack).toHaveBeenCalledWith(currentTrack);
    expect(deviceService.applyAudioOutput).toHaveBeenCalledExactlyOnceWith("new-out");
    await deviceChange(devices);
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(deviceService.applyAudioOutput).toHaveBeenCalledOnce();
  });

  it("ignores newly added built-in devices and routes when a headset reconnects", async () => {
    await startEffect();
    await deviceChange(internalDevices);
    await deviceChange({
      ...internalDevices,
      audioInputs: [...internalDevices.audioInputs, { deviceId: "webcam-mic", label: "Webcam Microphone", kind: "audioinput" }],
      audioOutputs: [...internalDevices.audioOutputs, { deviceId: "monitor", label: "Monitor Speakers", kind: "audiooutput" }],
    });
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(deviceService.applyAudioOutput).not.toHaveBeenCalled();

    await deviceChange(devices);
    expect(currentTrack.getSettings().deviceId).toBe("existing-mic");
    expect(deviceService.applyAudioOutput).toHaveBeenCalledWith("existing-out");
  });

  it("uses the first device event as a baseline if initial enumeration is still pending", async () => {
    let resolve!: (devices: AvailableDevices) => void;
    vi.mocked(deviceService.getAvailableDevices).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await startEffect();
    await deviceChange(devices);
    resolve(devices);
    await Promise.resolve();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(deviceService.applyAudioOutput).not.toHaveBeenCalled();
  });
});

describe("audio track recovery", () => {
  it.each([false, true])("recovers repeated endings on the same stream (auto-routed: %s)", async (autoRouted) => {
    await startEffect();
    if (autoRouted) {
      devices = withHeadset("new", devices);
      await deviceChange(devices);
    }
    const stream = state.stream;
    const initial = currentTrack;
    initial.dispatchEvent(new Event("ended"));
    await vi.waitFor(() => expect(currentTrack).not.toBe(initial));
    const replacement = currentTrack;
    replacement.dispatchEvent(new Event("ended"));
    await vi.waitFor(() => expect(currentTrack).not.toBe(replacement));

    expect(state.stream).toBe(stream);
    expect(currentTrack.getSettings().deviceId).not.toBe(replacement.getSettings().deviceId);
    expect(webrtcService.replaceAudioTrack).toHaveBeenCalledTimes(autoRouted ? 3 : 2);
    cleanup();
    currentTrack.dispatchEvent(new Event("ended"));
    await Promise.resolve();
    expect(webrtcService.replaceAudioTrack).toHaveBeenCalledTimes(autoRouted ? 3 : 2);
  });

  it("does not replace a track after cleanup while fallback enumeration is pending", async () => {
    await startEffect();
    let resolve!: (devices: AvailableDevices) => void;
    vi.mocked(deviceService.getAvailableDevices).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    currentTrack.dispatchEvent(new Event("ended"));
    cleanup();
    resolve(devices);
    await Promise.resolve();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
