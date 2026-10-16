import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useCallTimer, UseCallTimerOptions, UseCallTimerResult } from "../useCallTimer";

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
