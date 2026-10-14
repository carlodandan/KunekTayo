import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomDurableObject, type DurableRoomState } from "../RoomDurableObject";

vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    constructor(protected ctx: unknown) {}
  },
}));

function setup(status: "active" | "waiting" = "active") {
  const state: DurableRoomState = {
    roomId: "room", inviteTokenHash: "hash", status,
    participants: [
      { id: "host", role: "host", joinedAt: 1, lastPingAt: 1 },
      ...(status === "active" ? [{ id: "guest", role: "guest" as const, joinedAt: 1, lastPingAt: 1 }] : []),
    ],
    soloExpiresAt: null, createdAt: 1,
  };
  const sockets = new Map<string, { send: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }>();
  const storage = {
    get: vi.fn(async () => state), put: vi.fn(),
    setAlarm: vi.fn(), deleteAlarm: vi.fn(), deleteAll: vi.fn(),
  };
  const ctx = {
    storage,
    getWebSockets: vi.fn((id?: string) => id
      ? (sockets.has(id) ? [sockets.get(id)!] : []) : [...sockets.values()]),
    getTags: vi.fn((ws: { id: string }) => [ws.id]),
    setWebSocketAutoResponse: vi.fn(),
    acceptWebSocket: vi.fn(),
  };
  const room = new RoomDurableObject(ctx as unknown as DurableObjectState, {});
  const disconnect = (id: string) => room.webSocketClose({ id } as unknown as WebSocket);
  const connect = (id: string) => {
    const ws = { send: vi.fn(), close: vi.fn() };
    sockets.set(id, ws);
    return ws;
  };
  return { room, state, storage, ctx, disconnect, connect };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  vi.stubGlobal("WebSocketRequestResponsePair", class {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("disconnect grace alarms", () => {
  it("closes an active room after losing its host, broadcasts closure, and closes the guest socket", async () => {
    const { room, state, storage, disconnect, connect } = setup();
    const guest = connect("guest");
    await disconnect("host");
    await vi.advanceTimersByTimeAsync(45000);
    await room.alarm();
    expect(state.status).toBe("closed");
    expect(guest.send).toHaveBeenCalledWith(JSON.stringify({ type: "room_state", state: "closed", reason: "host_left" }));
    expect(guest.close).toHaveBeenCalledWith(4000, "Room Closed");
    expect(guest.send).toHaveBeenCalledBefore(guest.close);
    expect(storage.deleteAll).toHaveBeenCalledOnce();
    expect(storage.deleteAlarm).toHaveBeenCalled();
    storage.get.mockResolvedValueOnce(null as unknown as DurableRoomState);
    const response = await room.fetch(new Request("https://test/status"));
    expect(response.status).toBe(404);
  });

  it("preserves the waiting room and peer-left events after losing only its guest", async () => {
    const { room, state, storage, disconnect, connect } = setup();
    const host = connect("host");
    await disconnect("guest");
    await vi.advanceTimersByTimeAsync(45000);
    await room.alarm();
    expect(state.status).toBe("waiting");
    expect(state.participants.map((p) => p.id)).toEqual(["host"]);
    expect(state.disconnectGraceExpiresAt).toBeNull();
    expect(state.soloExpiresAt).toBeNull();
    expect(host.send).toHaveBeenCalledWith(JSON.stringify({ type: "peer_left", participantId: "guest" }));
    expect(host.close).not.toHaveBeenCalled();
    expect(storage.deleteAll).not.toHaveBeenCalled();
    expect(storage.put).toHaveBeenLastCalledWith("room_state", state);
  });

  it("cleans all storage when both participants fail to reconnect", async () => {
    const { room, state, storage, disconnect } = setup();
    await disconnect("host");
    await disconnect("guest");
    await vi.advanceTimersByTimeAsync(45000);
    await room.alarm();
    expect(state.status).toBe("closed");
    expect(state.participants).toEqual([]);
    expect(storage.deleteAll).toHaveBeenCalledOnce();
  });

  it("schedules a 45-second grace alarm for a waiting host and closes after expiry", async () => {
    const { room, state, storage, disconnect } = setup("waiting");
    await disconnect("host");
    expect(state.disconnectGraceExpiresAt).toBe(145000);
    expect(storage.setAlarm).toHaveBeenCalledWith(145000);
    await vi.advanceTimersByTimeAsync(44999);
    await room.alarm();
    expect(storage.deleteAll).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await room.alarm();
    expect(state.status).toBe("closed");
    expect(storage.deleteAll).toHaveBeenCalledOnce();
  });

  it.each(["active", "waiting"] as const)("keeps a %s room if the host has a socket when the alarm runs", async (status) => {
    const { room, state, storage, disconnect, connect } = setup(status);
    await disconnect("host");
    connect("host");
    await vi.advanceTimersByTimeAsync(45000);
    await room.alarm();
    expect(state.status).toBe(status);
    expect(state.disconnectGraceExpiresAt).toBeNull();
    expect(storage.deleteAll).not.toHaveBeenCalled();
  });

  it("clears the waiting-room grace alarm when the host rejoins", async () => {
    const { room, state, storage, disconnect } = setup("waiting");
    await disconnect("host");
    const response = await room.fetch(new Request("https://test/join", {
      method: "POST", body: JSON.stringify({ participantId: "host", inviteTokenHash: "hash" }),
    }));
    expect(response.status).toBe(200);
    expect(state.disconnectGraceExpiresAt).toBeNull();
    expect(storage.deleteAlarm).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(45000);
    await room.alarm();
    expect(state.status).toBe("waiting");
    expect(storage.deleteAll).not.toHaveBeenCalled();
  });

  it("does not schedule cleanup if another socket still represents the waiting host", async () => {
    const { state, storage, disconnect, connect } = setup("waiting");
    connect("host");
    await disconnect("host");
    expect(state.status).toBe("waiting");
    expect(storage.setAlarm).not.toHaveBeenCalled();
  });
});
