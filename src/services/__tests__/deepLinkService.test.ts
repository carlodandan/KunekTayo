import { describe, it, expect } from "vitest";
import { deepLinkService } from "../deepLinkService";

describe("DeepLink & Invite Routing Service", () => {
  it("builds deep links using kunektayo:// scheme", () => {
    const link = deepLinkService.buildDeepLink("test-room-123", "secret-token-456");
    expect(link).toBe("kunektayo://join?room=test-room-123&token=secret-token-456");
  });

  it("builds web invite links", () => {
    const webLink = deepLinkService.buildWebInviteUrl("test-room-123", "secret-token-456");
    expect(webLink).toContain("test-room-123");
    expect(webLink).toContain("secret-token-456");
  });

  it("parses kunektayo:// protocol deep link URLs", () => {
    const result = deepLinkService.parseInviteTarget("kunektayo://room?id=alpha-room&token=alpha-token");
    expect(result).not.toBeNull();
    expect(result?.roomId).toBe("alpha-room");
    expect(result?.token).toBe("alpha-token");
  });

  it("parses web invite URLs with hashes", () => {
    const result = deepLinkService.parseInviteTarget("https://kunektayo.app/#room=web-room-id&token=web-token-val");
    expect(result).not.toBeNull();
    expect(result?.roomId).toBe("web-room-id");
    expect(result?.token).toBe("web-token-val");
  });

  it("rejects invalid inputs", () => {
    expect(deepLinkService.parseInviteTarget("")).toBeNull();
    expect(deepLinkService.parseInviteTarget("   ")).toBeNull();
  });
});
