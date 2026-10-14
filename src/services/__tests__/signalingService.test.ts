import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "@/utils/crypto";
import { signalingService } from "../signalingService";

vi.mock("@/utils/crypto", () => ({ hashToken: vi.fn() }));

class MockWebSocket {
  static OPEN = 1;
  static CLOSING = 2;
  static instances: MockWebSocket[] = [];
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  // Model a socket whose close handshake never completes.
  close = vi.fn(() => { this.readyState = MockWebSocket.CLOSING; });

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }
}

function deferredHash() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  MockWebSocket.instances = [];
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("BroadcastChannel", class {
    postMessage = vi.fn();
    close = vi.fn();
  });
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.mocked(hashToken).mockResolvedValue("hash");
});

afterEach(() => {
  signalingService.disconnect();
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("signaling connection attempts", () => {
  it.each([true, false])("only creates the latest socket when the older hash resolves first: %s", async (olderFirst) => {
    const older = deferredHash();
    const newer = deferredHash();
    vi.mocked(hashToken).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

    const first = signalingService.connect("old_room", "old_token", "old_host");
    const second = signalingService.connect("new_room", "new_token", "new_host");
    if (olderFirst) {
      older.resolve("old_hash");
      await first;
      expect(MockWebSocket.instances).toHaveLength(0);
    }
    newer.resolve("new_hash");
    await second;
    older.resolve("old_hash");
    await first;

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain("/new_room/ws?tokenHash=new_hash&participantId=new_host");
    expect(signalingService.roomId).toBe("new_room");
  });

  it("does not create a socket after disconnect during hashing", async () => {
    const hash = deferredHash();
    vi.mocked(hashToken).mockReturnValueOnce(hash.promise);
    const attempt = signalingService.connect("room", "token", "host");
    signalingService.disconnect();
    hash.resolve("hash");
    await attempt;
    expect(MockWebSocket.instances).toHaveLength(0);
    expect(signalingService.roomId).toBeNull();
  });
});

describe("signaling heartbeat recovery", () => {
  async function openSocket() {
    await signalingService.connect("room", "token", "host");
    const socket = MockWebSocket.instances[0];
    socket.onopen!();
    return socket;
  }

  it("replaces a stale socket within the backoff delay without an onclose event", async () => {
    const socket = await openSocket();
    await vi.advanceTimersByTimeAsync(40000);
    expect(socket.close).toHaveBeenCalledOnce();
    expect(socket.readyState).toBe(MockWebSocket.CLOSING);
    expect(MockWebSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(socket.onclose).toBeNull();
  });

  it("does not postpone or duplicate the replacement when onclose arrives later", async () => {
    const socket = await openSocket();
    await vi.advanceTimersByTimeAsync(40500);
    socket.onclose!();
    await vi.advanceTimersByTimeAsync(500);
    expect(MockWebSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("cancels a heartbeat replacement on intentional disconnect", async () => {
    await openSocket();
    await vi.advanceTimersByTimeAsync(40000);
    signalingService.disconnect();
    await vi.advanceTimersByTimeAsync(5000);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps heartbeat pings and ordinary onclose reconnection working", async () => {
    const socket = await openSocket();
    await vi.advanceTimersByTimeAsync(20000);
    expect(socket.send).toHaveBeenCalledWith('{"type":"ping"}');
    socket.onmessage!({ data: '{"type":"pong"}' });
    await vi.advanceTimersByTimeAsync(20000);
    expect(socket.close).not.toHaveBeenCalled();
    socket.onclose!();
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });
});
