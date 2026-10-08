import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { Header } from "../Header";
import * as platformHook from "@/hooks/usePlatform";

describe("Header platform landing gating", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render view toggle buttons on native desktop/mobile platforms even if showViewToggle is true", () => {
    vi.spyOn(platformHook, "usePlatform").mockReturnValue({
      isTauriApp: true,
      isWindows: true,
      isAndroid: false,
      isWeb: false,
    });

    const toggleSpy = vi.fn();
    const element = Header({
      activeView: "app",
      onToggleView: toggleSpy,
      showViewToggle: true,
    });

    expect(React.isValidElement(element)).toBe(true);

    // Render tree should not include the overview toggle button container
    const stringified = JSON.stringify(element);
    expect(stringified).not.toContain("Overview");
  });

  it("renders view toggle on web platform when showViewToggle is true", () => {
    vi.spyOn(platformHook, "usePlatform").mockReturnValue({
      isTauriApp: false,
      isWindows: false,
      isAndroid: false,
      isWeb: true,
    });

    const toggleSpy = vi.fn();
    const element = Header({
      activeView: "app",
      onToggleView: toggleSpy,
      showViewToggle: true,
    });

    expect(React.isValidElement(element)).toBe(true);
    const stringified = JSON.stringify(element);
    expect(stringified).toContain("Overview");
  });
});
