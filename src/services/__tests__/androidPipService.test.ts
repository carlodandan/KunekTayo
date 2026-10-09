import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  notifyNativeCallState,
  requestNativePip,
  isNativePipSupported,
} from "../androidPipService";

describe("androidPipService", () => {
  beforeEach(() => {
    // Setup mock window environment for Node-based Vitest runner
    (globalThis as any).window = {};
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  describe("isNativePipSupported", () => {
    it("returns false without a bridge or when the bridge reports no support", () => {
      expect(isNativePipSupported()).toBe(false);
      const isSupported = vi.fn().mockReturnValue(false);
      window.AndroidCallBridge = {
        setCallActive: vi.fn(),
        enterPip: vi.fn(),
        isSupported,
      };
      expect(isNativePipSupported()).toBe(false);
      expect(isSupported).toHaveBeenCalledOnce();
    });

    it("supports legacy bridges and bridges that report support", () => {
      (globalThis as any).window.AndroidCallBridge = {
        setCallActive: vi.fn(),
        enterPip: vi.fn(),
      };
      expect(isNativePipSupported()).toBe(true);
      const isSupported = vi.fn().mockReturnValue(true);
      window.AndroidCallBridge!.isSupported = isSupported;
      expect(isNativePipSupported()).toBe(true);
      expect(isSupported).toHaveBeenCalledOnce();
    });
  });

  describe("notifyNativeCallState", () => {
    it("safely does nothing when bridge is not available", () => {
      expect(() => notifyNativeCallState(true)).not.toThrow();
    });

    it("calls setCallActive(true) on the bridge when active is true", () => {
      const mockSetCallActive = vi.fn();
      (globalThis as any).window.AndroidCallBridge = {
        setCallActive: mockSetCallActive,
      };

      notifyNativeCallState(true);
      expect(mockSetCallActive).toHaveBeenCalledWith(true);
    });

    it("calls setCallActive(false) on the bridge when active is false", () => {
      const mockSetCallActive = vi.fn();
      (globalThis as any).window.AndroidCallBridge = {
        setCallActive: mockSetCallActive,
      };

      notifyNativeCallState(false);
      expect(mockSetCallActive).toHaveBeenCalledWith(false);
    });
  });

  describe("requestNativePip", () => {
    it("returns false when bridge is not available", () => {
      expect(requestNativePip()).toBe(false);
    });

    it("returns result of enterPip() from native bridge", () => {
      const mockEnterPip = vi.fn().mockReturnValue(true);
      (globalThis as any).window.AndroidCallBridge = {
        enterPip: mockEnterPip,
      };

      expect(requestNativePip()).toBe(true);
      expect(mockEnterPip).toHaveBeenCalledTimes(1);
    });

    it("handles native bridge exceptions gracefully", () => {
      (globalThis as any).window.AndroidCallBridge = {
        enterPip: vi.fn().mockImplementation(() => {
          throw new Error("Android PiP rejected by system");
        }),
      };

      expect(requestNativePip()).toBe(false);
    });
  });
});
