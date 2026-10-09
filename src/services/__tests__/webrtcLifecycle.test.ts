import { afterEach, describe, expect, it, vi } from "vitest";
import { webrtcService } from "../webrtcService";

vi.mock("../signalingService", () => ({
  signalingService: { on: vi.fn(), sendOffer: vi.fn() },
}));

afterEach(() => {
  webrtcService.stopAllMedia();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function media(kind: "audio" | "video") {
  const track = { kind, stop: vi.fn() };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => kind === "audio" ? [track] : [],
    getVideoTracks: () => kind === "video" ? [track] : [],
  } as unknown as MediaStream;
  return { track, stream };
}

describe("local media lifecycle", () => {
  it.each([false, true])("discards a pending media request after teardown (fallback: %s)", async (fallback) => {
    const { track, stream } = media("audio");
    let resolve!: (stream: MediaStream) => void;
    const pending = new Promise<MediaStream>((done) => { resolve = done; });
    const getUserMedia = vi.fn().mockReturnValue(pending);
    if (fallback) getUserMedia.mockRejectedValueOnce(new Error("Camera unavailable"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    const onStream = vi.fn();
    const unsubscribe = webrtcService.on("local_stream", onStream);

    const starting = webrtcService.startLocalMedia();
    await Promise.resolve();
    webrtcService.stopAllMedia();
    resolve(stream);

    await expect(starting).resolves.toBeNull();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(webrtcService.getLocalStream()).toBeNull();
    expect(onStream).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("keeps the newest stream when an older request finishes last", async () => {
    const older = media("audio");
    const newer = media("audio");
    let resolve!: (stream: MediaStream) => void;
    const pending = new Promise<MediaStream>((done) => { resolve = done; });
    vi.stubGlobal("navigator", { mediaDevices: {
      getUserMedia: vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(newer.stream),
    } });
    const starting = webrtcService.startLocalMedia();
    webrtcService.stopAllMedia();
    await webrtcService.startLocalMedia();
    resolve(older.stream);
    await expect(starting).resolves.toBeNull();
    expect(webrtcService.getLocalStream()).toBe(newer.stream);
    expect(older.track.stop).toHaveBeenCalledOnce();
    expect(newer.track.stop).not.toHaveBeenCalled();
  });
});

describe("screen sharing negotiation", () => {
  it.each(["audio", "video"] as const)("reuses the initial video sender for a %s call", async (kind) => {
    const local = media(kind);
    const display = media("video");
    const senders: { track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }[] = [];
    const makeSender = (track: MediaStreamTrack | null) => {
      const sender = { track, replaceTrack: vi.fn(async (next: MediaStreamTrack | null) => { sender.track = next; }) };
      senders.push(sender);
      return sender;
    };
    const pc = {
      addTrack: vi.fn((track: MediaStreamTrack) => makeSender(track)),
      addTransceiver: vi.fn(() => ({ sender: makeSender(null) })),
      getSenders: () => senders,
      createDataChannel: vi.fn(() => ({ close: vi.fn() })),
      createOffer: vi.fn(async () => ({ type: "offer", sdp: "test" })),
      setLocalDescription: vi.fn(),
      close: vi.fn(),
    };
    vi.stubGlobal("MediaStream", vi.fn(function () { return {}; }));
    vi.stubGlobal("RTCPeerConnection", vi.fn(function () { return pc; }));
    vi.stubGlobal("navigator", { mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(local.stream),
      getDisplayMedia: vi.fn().mockResolvedValue(display.stream),
    } });
    await webrtcService.startLocalMedia();
    webrtcService.initPeerConnection(true);
    if (kind === "audio") {
      expect(pc.addTransceiver).toHaveBeenCalledWith("video", { direction: "sendrecv", streams: [local.stream] });
    } else {
      expect(pc.addTransceiver).not.toHaveBeenCalled();
    }
    await webrtcService.createAndSendOffer();
    const videoSender = senders.find((sender) => sender.track?.kind === "video" || sender.track === null)!;
    pc.addTrack.mockClear();
    pc.addTransceiver.mockClear();

    await webrtcService.startScreenShare();
    expect(videoSender.track).toBe(display.track);
    await webrtcService.stopScreenShare();
    expect(videoSender.track).toBe(kind === "video" ? local.track : null);
    await webrtcService.startScreenShare();
    expect(videoSender.track).toBe(display.track);
    expect(pc.addTrack).not.toHaveBeenCalled();
    expect(pc.addTransceiver).not.toHaveBeenCalled();
    expect(pc.createOffer).toHaveBeenCalledOnce();
  });
});
