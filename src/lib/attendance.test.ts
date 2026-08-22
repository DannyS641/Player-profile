import { describe, it, expect } from "vitest";
import {
  buildAttendanceRows,
  computeStreak,
  computeAttendanceRate,
  type AttendanceRow,
} from "./attendance";

describe("buildAttendanceRows", () => {
  it("marks a session present when zoom minutes meet the minimum", () => {
    const rows = buildAttendanceRows({
      events: [{ session_date: "2026-08-10", duration_minutes: 15 }],
      overrides: [],
      selfCheckIns: [],
      minMinutes: 10,
    });
    expect(rows).toEqual([
      {
        session_date: "2026-08-10",
        status: "present",
        minutes: 15,
        source: "zoom",
        note: "Stayed 15 mins",
      },
    ]);
  });

  it("marks a session absent when zoom minutes fall short of the minimum", () => {
    const rows = buildAttendanceRows({
      events: [{ session_date: "2026-08-10", duration_minutes: 3 }],
      overrides: [],
      selfCheckIns: [],
      minMinutes: 10,
    });
    expect(rows[0].status).toBe("absent");
  });

  it("lets an admin override win over a zoom event on the same date", () => {
    const rows = buildAttendanceRows({
      events: [{ session_date: "2026-08-10", duration_minutes: 3 }],
      overrides: [
        { session_date: "2026-08-10", status: "present", reason: "Injury excused" },
      ],
      selfCheckIns: [],
      minMinutes: 10,
    });
    expect(rows[0]).toMatchObject({
      status: "present",
      source: "override",
      note: "Injury excused",
    });
  });

  it("treats a self check-in with no zoom event as pending", () => {
    const rows = buildAttendanceRows({
      events: [],
      overrides: [],
      selfCheckIns: [{ session_date: "2026-08-10", method: "self_checkin" }],
      minMinutes: 10,
    });
    expect(rows[0].status).toBe("pending");
  });

  it("treats a zoom-webhook check-in with no duration as present", () => {
    const rows = buildAttendanceRows({
      events: [],
      overrides: [],
      selfCheckIns: [{ session_date: "2026-08-10", method: "zoom_webhook" }],
      minMinutes: 10,
    });
    expect(rows[0].status).toBe("present");
  });

  it("sorts rows newest-first", () => {
    const rows = buildAttendanceRows({
      events: [
        { session_date: "2026-08-01", duration_minutes: 15 },
        { session_date: "2026-08-15", duration_minutes: 15 },
      ],
      overrides: [],
      selfCheckIns: [],
      minMinutes: 10,
    });
    expect(rows.map((r) => r.session_date)).toEqual([
      "2026-08-15",
      "2026-08-01",
    ]);
  });
});

describe("computeStreak", () => {
  const row = (status: string): AttendanceRow => ({
    session_date: "2026-08-01",
    status,
    minutes: 0,
    source: "zoom",
    note: "",
  });

  it("counts consecutive present rows from the start (most recent first)", () => {
    expect(computeStreak([row("present"), row("present"), row("absent")])).toBe(2);
  });

  it("is zero when the most recent session was not present", () => {
    expect(computeStreak([row("absent"), row("present")])).toBe(0);
  });

  it("is zero for an empty history", () => {
    expect(computeStreak([])).toBe(0);
  });
});

describe("computeAttendanceRate", () => {
  const row = (status: string): AttendanceRow => ({
    session_date: "2026-08-01",
    status,
    minutes: 0,
    source: "zoom",
    note: "",
  });

  it("returns 0 for no recorded sessions", () => {
    expect(computeAttendanceRate([])).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    expect(
      computeAttendanceRate([row("present"), row("present"), row("absent")]),
    ).toBe(67);
  });

  it("is 100 when every session is present", () => {
    expect(computeAttendanceRate([row("present"), row("present")])).toBe(100);
  });
});
