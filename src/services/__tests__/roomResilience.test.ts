import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roomService } from "../roomService";
import { signalingService } from "../signalingService";

describe("Room Resilience & Session Persistence", () => {
  let mockStorageStore: Record<string, string> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorageStore = {};

    const mockSessionStorage = {
      getItem: vi.fn((key: string) => mockStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorageStore[key];
      }),
      clear: vi.fn(() => {
        mockStorageStore = {};
      }),
    };

    vi.stubGlobal("window", { sessionStorage: mockSessionStorage });
    vi.stubGlobal("sessionStorage", mockSessionStorage);
  });

  afterEach(() => {
    vi.useRealTimers();
    signalingService.disconnect();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("stores and retrieves cached rejoin session with original participantId", () => {
    const mockSession = {
      roomId: "room_test_123",
      inviteToken: "token_abc_456",
      participantId: "p_existing_guest",
      role: "guest" as const,
      lastActiveAt: Date.now(),
    };

    roomService.saveRejoinSession(mockSession);
    const retrieved = roomService.getRejoinSession();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.participantId).toBe("p_existing_guest");
    expect(retrieved?.roomId).toBe("room_test_123");
    expect(retrieved?.role).toBe("guest");
  });

  it("passes existing participantId when rejoining to avoid ROOM_FULL ejection", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        role: "guest",
        state: {
          roomId: "room_test_123",
          status: "active",
          participants: [
            { id: "p_host_1", role: "host", joinedAt: 1000, lastPingAt: 1000 },
            { id: "p_guest_2", role: "guest", joinedAt: 2000, lastPingAt: 2000 },
          ],
          soloExpiresAt: null,
        },
        rejoined: true,
      }),
    } as Response);

    const result = await roomService.joinRoom("room_test_123", "token_abc", "p_guest_2");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/rooms/room_test_123/join"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"participantId":"p_guest_2"'),
      })
    );
    expect(result.participantId).toBe("p_guest_2");
    expect(result.status).toBe("active");
  });

  it("dispatches peer_connection_status events through signalingService", () => {
    const statusHandler = vi.fn();
    const unsub = signalingService.on("peer_connection_status", statusHandler);

    signalingService.emit("peer_connection_status", {
      status: "disconnected",
      participantId: "peer_xyz",
      graceExpiresAt: Date.now() + 45000,
    });

    expect(statusHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "disconnected",
        participantId: "peer_xyz",
      })
    );

    unsub();
  });
});
