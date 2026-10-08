import { describe, it, expect, vi } from "vitest";

describe("EphemeralChat Input and Layout Logic", () => {
  it("trims messages and ignores whitespace-only submissions", () => {
    const validateSend = (input: string, sendFn: (text: string) => void) => {
      const trimmed = input.trim();
      if (!trimmed) return false;
      sendFn(trimmed);
      return true;
    };

    const mockSend = vi.fn();
    expect(validateSend("", mockSend)).toBe(false);
    expect(validateSend("   ", mockSend)).toBe(false);
    expect(validateSend("\n\t  ", mockSend)).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();

    expect(validateSend("  Hello private world!  ", mockSend)).toBe(true);
    expect(mockSend).toHaveBeenCalledWith("Hello private world!");
  });

  it("distinguishes Enter submission from Shift+Enter multiline newlines", () => {
    const handleKeyDown = (
      key: string,
      shiftKey: boolean,
      sendFn: () => void,
      preventDefaultFn: () => void
    ) => {
      if (key === "Enter" && !shiftKey) {
        preventDefaultFn();
        sendFn();
        return "sent";
      }
      return "newline";
    };

    const mockSend = vi.fn();
    const mockPreventDefault = vi.fn();

    // Plain Enter should trigger send and prevent default
    const result1 = handleKeyDown("Enter", false, mockSend, mockPreventDefault);
    expect(result1).toBe("sent");
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockPreventDefault).toHaveBeenCalledTimes(1);

    // Shift + Enter should insert newline without submitting
    const result2 = handleKeyDown("Enter", true, mockSend, mockPreventDefault);
    expect(result2).toBe("newline");
    expect(mockSend).toHaveBeenCalledTimes(1); // not incremented
  });

  it("calculates remaining TTL countdown seconds accurately", () => {
    const now = 1000000;
    const msg1 = { expiresAt: 1060000 }; // 60s in future
    const msg2 = { expiresAt: 999000 };  // already expired

    const getRemainingSecs = (expiresAt: number, currentNow: number) => {
      return Math.max(0, Math.ceil((expiresAt - currentNow) / 1000));
    };

    expect(getRemainingSecs(msg1.expiresAt, now)).toBe(60);
    expect(getRemainingSecs(msg2.expiresAt, now)).toBe(0);
  });
});
