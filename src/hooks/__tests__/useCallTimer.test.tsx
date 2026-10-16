import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useCallTimer, UseCallTimerOptions, UseCallTimerResult } from "../useCallTimer";

const { state, effects } = vi.hoisted(() => ({
  state: { values: [] as unknown[], index: 0 },
  effects: [] as (() => void | (() => void))[],
}));
// Retain hook state across server renders and exercise the resolution effect,
// following the provider effect tests without adding a browser dependency.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: <T,>(initial: T | (() => T)) => {
    const index = state.index++;
    if (!(index in state.values)) {
      state.values[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    }
    return [state.values[index], (next: T | ((prev: T) => T)) => {
      state.values[index] = typeof next === "function"
        ? (next as (prev: T) => T)(state.values[index] as T) : next;
    }];
  },
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
}));

function renderTimer(options: UseCallTimerOptions) {
  state.index = 0;
  effects.length = 0;
  let result!: UseCallTimerResult;
  renderToStaticMarkup(<TestComponent options={options} onRender={(value) => { result = value; }} />);
  effects[0]();
  state.index = 0;
  renderToStaticMarkup(<TestComponent options={options} onRender={(value) => { result = value; }} />);
  return result;
}

function TestComponent({
  options,
  onRender,
}: {
  options: UseCallTimerOptions;
  onRender: (result: UseCallTimerResult) => void;
}) {
  const result = useCallTimer(options);
  onRender(result);
  return null;
}

describe("useCallTimer hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    state.values = [];
    state.index = 0;
    effects.length = 0;
  });

  it("resolves a new start when the mounted hook changes rooms", () => {
    vi.spyOn(Date, "now").mockReturnValue(100000);
    expect(renderTimer({ roomId: "room1", participants: [{ joinedAt: 1000 }, { joinedAt: 5000 }] }).startTime).toBe(5000);
    const next = renderTimer({ roomId: "room2", participants: [{ joinedAt: 10000 }, { joinedAt: 90000 }] });
    expect(next.startTime).toBe(90000);
    expect(next.elapsedSeconds).toBe(10);
  });

  it("waits for the second participant and retains that start on reconnect", () => {
    const options = { roomId: "room1", participants: [{ joinedAt: 1000 }] };
    expect(renderTimer(options).startTime).toBeNull();
    expect(renderTimer({ ...options, participants: [...options.participants, { joinedAt: 5000 }] }).startTime).toBe(5000);
    expect(renderTimer(options).startTime).toBe(5000);
    expect(renderTimer({ ...options, roomId: "room2" }).startTime).toBeNull();
  });

  it("returns default zero values when inactive", () => {
    let captured: UseCallTimerResult | null = null;
    renderToStaticMarkup(
      <TestComponent
        options={{ isActive: false }}
        onRender={(res) => {
          captured = res;
        }}
      />
    );

    expect(captured!.elapsedSeconds).toBe(0);
    expect(captured!.formattedDuration).toBe("00:00");
    expect(captured!.hours).toBe(0);
    expect(captured!.minutes).toBe(0);
    expect(captured!.seconds).toBe(0);
    expect(captured!.startTime).toBeNull();
  });

  it("calculates elapsed time based on provided startTime", () => {
    const start = 50000;
    vi.spyOn(Date, "now").mockReturnValue(start + 75000); // 75 seconds later

    let captured: UseCallTimerResult | null = null;
    renderToStaticMarkup(
      <TestComponent
        options={{ startTime: start, isActive: true }}
        onRender={(res) => {
          captured = res;
        }}
      />
    );

    expect(captured!.elapsedSeconds).toBe(75);
    expect(captured!.formattedDuration).toBe("01:15");
    expect(captured!.minutes).toBe(1);
    expect(captured!.seconds).toBe(15);
    expect(captured!.hours).toBe(0);
  });

  it("calculates hours for calls longer than 1 hour", () => {
    const start = 50000;
    vi.spyOn(Date, "now").mockReturnValue(start + 3600000 + 120000 + 4000); // 1h 2m 4s

    let captured: UseCallTimerResult | null = null;
    renderToStaticMarkup(
      <TestComponent
        options={{ startTime: start, isActive: true }}
        onRender={(res) => {
          captured = res;
        }}
      />
    );

    expect(captured!.elapsedSeconds).toBe(3724);
    expect(captured!.formattedDuration).toBe("01:02:04");
    expect(captured!.hours).toBe(1);
    expect(captured!.minutes).toBe(2);
    expect(captured!.seconds).toBe(4);
  });
});
