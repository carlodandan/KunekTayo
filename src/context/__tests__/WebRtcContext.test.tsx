import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WebRtcProvider } from "../WebRtcContext";
import { webrtcService } from "@/services/webrtcService";
import { notifyNativeCallState } from "@/services/androidPipService";

const { effects, room } = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
  room: { status: "active", session: { roomId: "room", myRole: "host" } },
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
}));
vi.mock("../RoomContext", () => ({ useRoom: () => room }));
vi.mock("@/services/androidPipService", () => ({ notifyNativeCallState: vi.fn() }));
vi.mock("@/services/webrtcService", () => ({ webrtcService: {
  isNoiseSuppressionEnabled: () => true,
  startLocalMedia: vi.fn(), initPeerConnection: vi.fn(),
  createAndSendOffer: vi.fn(), stopAllMedia: vi.fn(),
} }));

function setupEffect() {
  effects.length = 0;
  renderToStaticMarkup(<WebRtcProvider>{null}</WebRtcProvider>);
  return effects[1]() as () => void;
}

beforeEach(() => {
  vi.useFakeTimers();
  room.status = "active";
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("room WebRTC lifecycle effect", () => {
  it("ignores acquisition completed after cleanup", async () => {
    let resolve!: (stream: MediaStream) => void;
    vi.mocked(webrtcService.startLocalMedia).mockReturnValue(new Promise((done) => { resolve = done; }));
    const cleanup = setupEffect();
    cleanup();
    resolve({} as MediaStream);
    await Promise.resolve();
    await vi.runAllTimersAsync();
    expect(notifyNativeCallState).not.toHaveBeenCalled();
    expect(webrtcService.initPeerConnection).not.toHaveBeenCalled();
    expect(webrtcService.createAndSendOffer).not.toHaveBeenCalled();
    expect(webrtcService.stopAllMedia).toHaveBeenCalledOnce();
  });

  it("cancels the host offer on cleanup", async () => {
    vi.mocked(webrtcService.startLocalMedia).mockResolvedValue({} as MediaStream);
    const cleanup = setupEffect();
    await Promise.resolve();
    expect(notifyNativeCallState).toHaveBeenCalledWith(true);
    expect(webrtcService.initPeerConnection).toHaveBeenCalledWith(true);
    expect(vi.getTimerCount()).toBe(1);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
    await vi.runAllTimersAsync();
    expect(webrtcService.createAndSendOffer).not.toHaveBeenCalled();
  });

  it("sends the host offer while the effect is active", async () => {
    vi.mocked(webrtcService.startLocalMedia).mockResolvedValue({} as MediaStream);
    const cleanup = setupEffect();
    await vi.advanceTimersByTimeAsync(600);
    expect(webrtcService.createAndSendOffer).toHaveBeenCalledOnce();
    cleanup();
  });
});
