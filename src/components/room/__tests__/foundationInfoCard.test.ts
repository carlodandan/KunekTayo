import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { FoundationInfoCard } from "../FoundationInfoCard";
import { env } from "@/config/env";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (initial: any) => [
      typeof initial === "function" ? initial() : initial,
      vi.fn(),
    ],
  };
});

vi.mock("@/hooks/usePlatform", () => ({
  usePlatform: () => ({
    isTauriApp: false,
    isWindows: false,
    isAndroid: false,
    isWeb: true,
  }),
}));

describe("FoundationInfoCard Environment Visibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null in production environments without executing hooks", () => {
    vi.spyOn(env, "isDev", "get").mockReturnValue(false);

    const result = FoundationInfoCard({});
    expect(result).toBeNull();
  });

  it("renders when env.isDev is enabled", () => {
    vi.spyOn(env, "isDev", "get").mockReturnValue(true);

    const result = FoundationInfoCard({});
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });
});
