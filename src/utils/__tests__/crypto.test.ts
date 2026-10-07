import { describe, it, expect } from "vitest";
import {
  generateRoomId,
  generateInviteToken,
  generateParticipantId,
  hashToken,
  timingSafeEqual,
  parseInviteInput,
  buildInviteUrl,
} from "../crypto";

describe("Crypto & Security Utilities", () => {
  it("generates a 16-character hex room ID with high randomness", () => {
    const id1 = generateRoomId();
    const id2 = generateRoomId();

    expect(id1).toHaveLength(16);
    expect(id2).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(id1)).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it("generates a 32-character hex invite token (128-bit entropy)", () => {
    const token1 = generateInviteToken();
    const token2 = generateInviteToken();

    expect(token1).toHaveLength(32);
    expect(token2).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(token1)).toBe(true);
    expect(token1).not.toBe(token2);
  });

  it("generates an ephemeral participant ID starting with p_", () => {
    const p1 = generateParticipantId();
    const p2 = generateParticipantId();

    expect(p1.startsWith("p_")).toBe(true);
    expect(p1).not.toBe(p2);
  });

  it("hashes token to standard 64-character SHA-256 hex string", async () => {
    const token = "a1b2c3d4e5f607182930415263748596";
    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);

    expect(hash1).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    expect(hash1).toBe(hash2);

    const hashOther = await hashToken("different-token-value");
    expect(hash1).not.toBe(hashOther);
  });

  it("verifies timingSafeEqual behavior", () => {
    expect(timingSafeEqual("abc123xyz", "abc123xyz")).toBe(true);
    expect(timingSafeEqual("abc123xyz", "abc123xyw")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("", "a")).toBe(false);
  });

  it("parses room ID and token from URL fragments", () => {
    const url = "https://kunektayo.app/#room=a1b2c3d4e5f60718&token=99887766554433221100aabbccddeeff";
    const parsed = parseInviteInput(url);

    expect(parsed).not.toBeNull();
    expect(parsed?.roomId).toBe("a1b2c3d4e5f60718");
    expect(parsed?.token).toBe("99887766554433221100aabbccddeeff");
  });

  it("parses query parameters and raw room IDs", () => {
    const queryUrl = "https://kunektayo.app/?roomId=room1234&token=tok5678";
    const parsedQuery = parseInviteInput(queryUrl);
    expect(parsedQuery?.roomId).toBe("room1234");
    expect(parsedQuery?.token).toBe("tok5678");

    const rawId = "custom-room-identifier";
    const parsedRaw = parseInviteInput(rawId);
    expect(parsedRaw?.roomId).toBe("custom-room-identifier");
    expect(parsedRaw?.token).toBeUndefined();

    expect(parseInviteInput("   ")).toBeNull();
  });

  it("constructs standard invite URL", () => {
    const url = buildInviteUrl("room123", "token456");
    expect(url).toContain("#room=room123&token=token456");
  });
});
