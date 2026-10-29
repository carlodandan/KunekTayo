import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RoomProvider, useRoom } from "../RoomContext";
import { roomService } from "@/services/roomService";
import { resolveCallStartedAt } from "@/utils/callTimer";
import type { RoomSession } from "@/types/room";

const { effects, listeners, fixture } = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
  listeners: new Map<string, (payload: Record<string, unknown>) => void>(),
  fixture: { session: null as RoomSession | null, stateIndex: 0 },
}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: <T,>(initial: T | (() => T)) => actual.useState(
      fixture.stateIndex++ === 0 ? fixture.session as T : initial
    ),
    useEffect: (effect: () => void | (() => void)) => effects.push(effect),
  };
});
vi.mock("@/services/signalingService", () => ({ signalingService: {
  connect: vi.fn(), disconnect: vi.fn(),
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => {
    listeners.set(event, handler);
    return () => listeners.delete(event);
  },
} }));
vi.mock("@/services/roomService", () => ({ roomService: {
  getRejoinSession: () => null, joinRoom: vi.fn(),
} }));
vi.mock("@/services/androidPipService", () => ({ notifyNativeCallState: vi.fn() }));

let room!: ReturnType<typeof useRoom>;
function Probe() {
  room = useRoom();
  return null;
}

beforeEach(() => {
  fixture.stateIndex = 0;
  fixture.session = {
    roomId: "room1", inviteToken: "token", status: "active", myRole: "host",
    myParticipantId: "host", createdAt: 1000, soloExpiresAt: null,
    participants: [
      { id: "host", role: "host", joinedAt: 1000, isAudioActive: true, isVideoActive: true },
      { id: "guest", role: "guest", joinedAt: 5000, isAudioActive: true, isVideoActive: true },
    ],
  };
  const storage = new Map<string, string>([["kunektayo_call_started_room1", "5000"]]);
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  effects.length = 0;
  listeners.clear();
  renderToStaticMarkup(<RoomProvider><Probe /></RoomProvider>);
  effects[1](); // Connect the session's signaling listeners.
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("call timer cache at room lifecycle boundaries", () => {
  it("preserves the start during disconnects, then clears it on confirmed waiting", () => {
    listeners.get("peer_connection_status")!({ status: "disconnected" });
    listeners.get("room_state")!({ state: "active" });
    expect(resolveCallStartedAt([{ joinedAt: 1000 }], "room1")).toBe(5000);

    listeners.get("room_state")!({ state: "waiting", participants: fixture.session!.participants.slice(0, 1) });
    expect(resolveCallStartedAt([{ joinedAt: 1000 }], "room1")).toBeNull();
    expect(resolveCallStartedAt([{ joinedAt: 1000 }, { joinedAt: 9000 }], "room1")).toBe(9000);
  });

  it("clears the previous call when simulating a participant departure", () => {
    room.simulateSecondParticipantLeave();
    expect(resolveCallStartedAt([{ joinedAt: 1000 }, { joinedAt: 9000 }], "room1")).toBe(9000);
  });

  it("clears a stale start when joining a room confirmed to be waiting", async () => {
    vi.mocked(roomService.joinRoom).mockResolvedValue({
      roomId: "room1", status: "waiting", role: "host", participantId: "host",
      participants: fixture.session!.participants.slice(0, 1), soloExpiresAt: null,
    });
    await room.joinRoom("room1", "token", "host");
    expect(resolveCallStartedAt([{ joinedAt: 1000 }], "room1")).toBeNull();
  });
});
