import { afterEach, describe, expect, it, vi } from "vitest";
import { deviceService } from "../deviceService";
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
    const pc = { getSenders: vi.fn(() => [sender]), close: vi.fn() };
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
