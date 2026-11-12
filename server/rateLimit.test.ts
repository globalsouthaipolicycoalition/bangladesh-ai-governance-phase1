import { afterEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimitsForTest } from "./rateLimit";

afterEach(resetRateLimitsForTest);

describe("sensitive mutation rate limits", () => {
  it("bounds requests per key within a time window and resets after expiry", () => {
    expect(consumeRateLimit("invite:user:1", 2, 1_000, 10_000)).toBe(true);
    expect(consumeRateLimit("invite:user:1", 2, 1_000, 10_001)).toBe(true);
    expect(consumeRateLimit("invite:user:1", 2, 1_000, 10_002)).toBe(false);
    expect(consumeRateLimit("invite:user:1", 2, 1_000, 11_000)).toBe(true);
  });

  it("bounds storage when many unique authenticated keys arrive", () => {
    for (let index = 0; index < 10_500; index += 1) expect(consumeRateLimit(`key:${index}`, 1, 60_000, 0)).toBe(true);
    expect(consumeRateLimit("key:10499", 1, 60_000, 1)).toBe(false);
  });

  it("isolates authenticated users and rejects invalid policies", () => {
    expect(consumeRateLimit("upload:user:1", 1, 100, 5)).toBe(true);
    expect(consumeRateLimit("upload:user:2", 1, 100, 5)).toBe(true);
    expect(consumeRateLimit("", 3, 100, 5)).toBe(false);
    expect(consumeRateLimit("bad", 0, 100, 5)).toBe(false);
  });
});
