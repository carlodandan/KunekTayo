import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatCallDuration,
  resolveCallStartedAt,
  clearCallStartedAt,
} from "../callTimer";

describe("Call Timer Utilities", () => {
  describe("formatCallDuration", () => {
    it("formats 0 seconds as 00:00", () => {
      expect(formatCallDuration(0)).toBe("00:00");
    });

    it("handles negative seconds safely by clamping to 00:00", () => {
      expect(formatCallDuration(-10)).toBe("00:00");
    });

    it("formats sub-minute times with leading zeros", () => {
      expect(formatCallDuration(5)).toBe("00:05");
      expect(formatCallDuration(59)).toBe("00:59");
    });

    it("formats minutes and seconds accurately", () => {
      expect(formatCallDuration(60)).toBe("01:00");
      expect(formatCallDuration(125)).toBe("02:05");
      expect(formatCallDuration(599)).toBe("09:59");
      expect(formatCallDuration(3599)).toBe("59:59");
    });

    it("switches to HH:MM:SS format when duration reaches 1 hour or more", () => {
      expect(formatCallDuration(3600)).toBe("01:00:00");
      expect(formatCallDuration(3665)).toBe("01:01:05");
      expect(formatCallDuration(7322)).toBe("02:02:02");
    });
  });

  describe("resolveCallStartedAt & clearCallStartedAt", () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      for (const key of Object.keys(mockStorage)) {
        delete mockStorage[key];
      }
      vi.stubGlobal("sessionStorage", {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
      });
    });

    it("resolves start time from 2 participants using the 2nd joined participant", () => {
      const participants = [
        { joinedAt: 1000 },
        { joinedAt: 5000 },
      ];
      const result = resolveCallStartedAt(participants, "room1");
      expect(result).toBe(5000);
      expect(mockStorage["kunektayo_call_started_room1"]).toBe("5000");
    });

    it("returns cached start time from sessionStorage if already stored", () => {
      mockStorage["kunektayo_call_started_room1"] = "4000";
      const participants = [
        { joinedAt: 1000 },
        { joinedAt: 5000 },
      ];
      const result = resolveCallStartedAt(participants, "room1");
      expect(result).toBe(4000);
    });

    it("clears cached start time on clearCallStartedAt", () => {
      mockStorage["kunektayo_call_started_room1"] = "4000";
      clearCallStartedAt("room1");
      expect(mockStorage["kunektayo_call_started_room1"]).toBeUndefined();
    });
  });
});
