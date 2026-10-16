import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CallDurationBadge } from "../CallDurationBadge";
import * as roomContextModule from "@/context/RoomContext";

describe("CallDurationBadge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when the room is not active", () => {
    vi.spyOn(roomContextModule, "useRoom").mockReturnValue({
      status: "waiting",
      session: null,
    } as any);

    const html = renderToStaticMarkup(<CallDurationBadge />);
    expect(html).toBe("");
  });

  it("renders call duration badge when the room is active", () => {
    const fixedNow = 100000;
    vi.spyOn(Date, "now").mockReturnValue(fixedNow + 125000); // 125 seconds after start

    vi.spyOn(roomContextModule, "useRoom").mockReturnValue({
      status: "active",
      session: {
        roomId: "testroom1",
        participants: [
          { joinedAt: fixedNow },
          { joinedAt: fixedNow },
        ],
      },
    } as any);

    const html = renderToStaticMarkup(
      <CallDurationBadge startTime={fixedNow} />
    );

    expect(html).toContain("02:05");
    expect(html).toContain("Call duration: 02:05");
  });

  it("formats hours when call duration exceeds 60 minutes", () => {
    const fixedNow = 100000;
    vi.spyOn(Date, "now").mockReturnValue(fixedNow + 3665000); // 1h 1m 5s

    vi.spyOn(roomContextModule, "useRoom").mockReturnValue({
      status: "active",
      session: {
        roomId: "testroom1",
        participants: [{ joinedAt: fixedNow }],
      },
    } as any);

    const html = renderToStaticMarkup(
      <CallDurationBadge startTime={fixedNow} />
    );

    expect(html).toContain("01:01:05");
    expect(html).toContain("Call duration: 01:01:05");
  });
});
