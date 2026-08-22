import { describe, it, expect } from "vitest";
import { distanceMeters } from "./checkinLocation";

describe("distanceMeters", () => {
  it("is zero for identical coordinates", () => {
    expect(distanceMeters(6.5244, 3.3792, 6.5244, 3.3792)).toBeCloseTo(0, 3);
  });

  it("matches a known real-world straight-line distance within tolerance", () => {
    // Lagos, Nigeria to Abuja, Nigeria — great-circle distance is ~526km.
    const d = distanceMeters(6.5244, 3.3792, 9.0765, 7.3986);
    expect(d).toBeGreaterThan(500_000);
    expect(d).toBeLessThan(550_000);
  });

  it("is symmetric regardless of argument order", () => {
    const a = distanceMeters(6.5244, 3.3792, 6.6018, 3.3515);
    const b = distanceMeters(6.6018, 3.3515, 6.5244, 3.3792);
    expect(a).toBeCloseTo(b, 6);
  });

  it("returns a small distance for two nearby points on the same block", () => {
    // ~111m per 0.001 degree of latitude at the equator.
    const d = distanceMeters(6.5244, 3.3792, 6.5254, 3.3792);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(130);
  });
});
