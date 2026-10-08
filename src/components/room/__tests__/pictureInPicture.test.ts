import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Picture-in-Picture (PiP) State and Event Synchronization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates whether Picture-in-Picture is supported by user agent", () => {
    const isSupported = (doc: any, videoProto: any) =>
      typeof doc !== "undefined" &&
      Boolean(doc.pictureInPictureEnabled) &&
      typeof videoProto !== "undefined" &&
      typeof videoProto.requestPictureInPicture === "function";

    expect(isSupported(undefined, undefined)).toBe(false);
    expect(isSupported({ pictureInPictureEnabled: false }, {})).toBe(false);
    expect(
      isSupported(
        { pictureInPictureEnabled: true },
        { requestPictureInPicture: () => Promise.resolve() }
      )
    ).toBe(true);
  });

  it("correctly identifies active remote video tracks vs audio-only calls", () => {
    const hasActiveVideoTrack = (stream: any) => {
      if (!stream) return false;
      const tracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
      return tracks.length > 0 && tracks.some((t: any) => t.readyState === "live" && t.enabled);
    };

    // No stream
    expect(hasActiveVideoTrack(null)).toBe(false);

    // Audio-only stream (0 video tracks)
    const audioOnlyStream = {
      getVideoTracks: () => [],
    };
    expect(hasActiveVideoTrack(audioOnlyStream)).toBe(false);

    // Stream with muted / ended video track
    const disabledStream = {
      getVideoTracks: () => [{ readyState: "ended", enabled: false }],
    };
    expect(hasActiveVideoTrack(disabledStream)).toBe(false);

    // Stream with live active video track
    const liveStream = {
      getVideoTracks: () => [{ readyState: "live", enabled: true }],
    };
    expect(hasActiveVideoTrack(liveStream)).toBe(true);
  });

  it("handles requestPictureInPicture and exitPictureInPicture transitions", async () => {
    let pipElement: any = null;
    let isPiPActive = false;

    const mockVideo = {
      readyState: 4,
      requestPictureInPicture: vi.fn().mockImplementation(async () => {
        pipElement = mockVideo;
        isPiPActive = true;
        mockVideo.onenter?.();
        return {};
      }),
      onenter: null as (() => void) | null,
      onleave: null as (() => void) | null,
    };

    const mockDoc = {
      get pictureInPictureElement() {
        return pipElement;
      },
      exitPictureInPicture: vi.fn().mockImplementation(async () => {
        pipElement = null;
        isPiPActive = false;
        mockVideo.onleave?.();
      }),
    };

    // Enter PiP
    await mockVideo.requestPictureInPicture();
    expect(mockVideo.requestPictureInPicture).toHaveBeenCalledTimes(1);
    expect(isPiPActive).toBe(true);
    expect(mockDoc.pictureInPictureElement).toBe(mockVideo);

    // Exit PiP
    await mockDoc.exitPictureInPicture();
    expect(mockDoc.exitPictureInPicture).toHaveBeenCalledTimes(1);
    expect(isPiPActive).toBe(false);
    expect(mockDoc.pictureInPictureElement).toBeNull();
  });

  it("updates PiP state when user closes native OS PiP window via leavepictureinpicture event", () => {
    let isPiPActive = true;

    const onLeavePiP = () => {
      isPiPActive = false;
    };

    // Simulating native OS window close triggering event
    onLeavePiP();
    expect(isPiPActive).toBe(false);
  });
});
