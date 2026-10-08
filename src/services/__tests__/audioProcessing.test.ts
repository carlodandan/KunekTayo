import { describe, it, expect, vi, beforeEach } from "vitest";
import { webrtcService } from "../webrtcService";
import { deviceService } from "../deviceService";

describe("Audio Processing and Noise Suppression", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with noise suppression enabled by default", () => {
    expect(webrtcService.isNoiseSuppressionEnabled()).toBe(true);
    expect(webrtcService.getState().isNoiseSuppressionEnabled).toBe(true);
  });

  it("supplies high-fidelity voice constraints in startLocalMedia", async () => {
    let capturedConstraints: any = null;

    const mockGetUserMedia = vi.fn().mockImplementation(async (constraints: any) => {
      capturedConstraints = constraints;
      return {
        getTracks: () => [],
        getAudioTracks: () => [
          {
            kind: "audio",
            applyConstraints: vi.fn().mockResolvedValue(undefined),
          },
        ],
        getVideoTracks: () => [],
      };
    });

    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    });

    await webrtcService.startLocalMedia(true, false);

    expect(mockGetUserMedia).toHaveBeenCalled();
    expect(capturedConstraints.audio).toEqual({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    });
  });

  it("updates noise suppression state and applies constraints to active track", async () => {
    const mockApplyConstraints = vi.fn().mockResolvedValue(undefined);
    const mockAudioTrack = {
      kind: "audio",
      applyConstraints: mockApplyConstraints,
    };

    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [mockAudioTrack],
          getAudioTracks: () => [mockAudioTrack],
          getVideoTracks: () => [],
        }),
      },
    });

    await webrtcService.startLocalMedia(true, false);

    let emittedEvent: any = null;
    const unsub = webrtcService.on("audio_processing_change", (data) => {
      emittedEvent = data;
    });

    // Disable noise suppression
    const resultFalse = await webrtcService.setNoiseSuppression(false);
    expect(resultFalse).toBe(false);
    expect(webrtcService.isNoiseSuppressionEnabled()).toBe(false);
    expect(mockApplyConstraints).toHaveBeenCalledWith({
      noiseSuppression: false,
      echoCancellation: true,
      autoGainControl: true,
      channelCount: 1,
    });
    expect(emittedEvent).toEqual({ noiseSuppression: false });

    // Re-enable noise suppression
    const resultTrue = await webrtcService.setNoiseSuppression(true);
    expect(resultTrue).toBe(true);
    expect(webrtcService.isNoiseSuppressionEnabled()).toBe(true);
    expect(mockApplyConstraints).toHaveBeenCalledWith({
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      channelCount: 1,
    });
    expect(emittedEvent).toEqual({ noiseSuppression: true });

    unsub();
  });

  it("passes noise suppression preference when switching audio input devices", async () => {
    let capturedConstraints: any = null;

    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockImplementation(async (constraints: any) => {
          capturedConstraints = constraints;
          return {
            getAudioTracks: () => [{ kind: "audio", stop: vi.fn() }],
          };
        }),
      },
    });

    const mockOldTrack = { kind: "audio", stop: vi.fn() };
    const mockStream = {
      getAudioTracks: () => [mockOldTrack],
      removeTrack: vi.fn(),
      addTrack: vi.fn(),
    } as any;

    await deviceService.switchAudioDevice(mockStream, "mic-studio-id", false);

    expect(capturedConstraints.audio).toEqual({
      deviceId: { exact: "mic-studio-id" },
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: true,
      channelCount: 1,
    });
  });
});
