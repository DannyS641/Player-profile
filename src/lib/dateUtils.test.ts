import { describe, it, expect } from "vitest";
import { toISODate, isSameDay } from "./dateUtils";

describe("toISODate", () => {
  it("pads single-digit month and day", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("does not shift the date across a UTC day boundary", () => {
    // A late-night local time is the classic case where toISOString()
    // would silently roll over to the next UTC day.
    const lateNight = new Date(2026, 7, 21, 23, 45);
    expect(toISODate(lateNight)).toBe("2026-08-21");
  });

  it("handles December 31st correctly", () => {
    expect(toISODate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("isSameDay", () => {
  it("is true for the same calendar day at different times", () => {
    const morning = new Date(2026, 7, 21, 6, 0);
    const night = new Date(2026, 7, 21, 23, 0);
    expect(isSameDay(morning, night)).toBe(true);
  });

  it("is false across a month boundary", () => {
    expect(isSameDay(new Date(2026, 7, 31), new Date(2026, 8, 1))).toBe(false);
  });

  it("is false across a year boundary", () => {
    expect(isSameDay(new Date(2025, 11, 31), new Date(2026, 11, 31))).toBe(
      false,
    );
  });
});
