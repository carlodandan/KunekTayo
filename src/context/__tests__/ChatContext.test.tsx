import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatProvider } from "../ChatContext";

const { effects, room, lastRoomRef } = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
  room: { status: "active", session: { roomId: "room" } as { roomId: string } | null },
  lastRoomRef: { current: null as string | null },
}));
// Exercise the provider's effects with a ref retained across renders, as in the
// existing WebRtcContext tests, without requiring a browser test environment.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
  useRef: () => lastRoomRef,
}));
vi.mock("../RoomContext", () => ({ useRoom: () => room }));
vi.mock("@/services/webrtcService", () => ({ webrtcService: {} }));
vi.mock("@/services/signalingService", () => ({ signalingService: {} }));

function renderEffects() {
  effects.length = 0;
  renderToStaticMarkup(<ChatProvider>{null}</ChatProvider>);
}

beforeEach(() => {
  lastRoomRef.current = null;
  room.status = "active";
  room.session = { roomId: "room" };
  const storage = { getItem: vi.fn(() => null), removeItem: vi.fn(), setItem: vi.fn() };
  vi.stubGlobal("window", { sessionStorage: storage });
  vi.stubGlobal("sessionStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());

describe("chat cache cleanup", () => {
  it.each(["idle", "closed", "expired"])("removes the previous room's cache after session is cleared with status %s", (status) => {
    renderEffects();
    effects[0](); // Record the room on entry.
    room.session = null;
    room.status = status;
    renderEffects();
    effects[0](); // The entry effect must retain the last room when session is null.
    effects.at(-1)!();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("kunektayo_chat_room");
  });

  it.each(["active", "waiting"])("preserves the cache while the room is %s", (status) => {
    room.status = status;
    renderEffects();
    effects[0]();
    effects.at(-1)!();
    expect(sessionStorage.removeItem).not.toHaveBeenCalled();
  });

  it("cleans the most recently entered room", () => {
    renderEffects();
    effects[0]();
    room.session = { roomId: "new_room" };
    renderEffects();
    effects[0]();
    room.session = null;
    room.status = "idle";
    renderEffects();
    effects.at(-1)!();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("kunektayo_chat_new_room");
    expect(sessionStorage.removeItem).not.toHaveBeenCalledWith("kunektayo_chat_room");
  });
});
