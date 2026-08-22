export type AttendanceRow = {
  session_date: string;
  status: string;
  minutes: number;
  source: string;
  note: string;
};

export type AttendanceEvent = {
  session_date: string;
  duration_minutes: number | null;
};

export type AttendanceOverride = {
  session_date: string;
  status: string;
  reason: string | null;
};

export type SelfCheckIn = {
  session_date: string;
  method: string | null;
};

export function buildAttendanceRows({
  events,
  overrides,
  selfCheckIns,
  minMinutes,
}: {
  events: AttendanceEvent[];
  overrides: AttendanceOverride[];
  selfCheckIns: SelfCheckIn[];
  minMinutes: number;
}): AttendanceRow[] {
  const eventMap = new Map<string, number>();
  events.forEach((event) => {
    const minutes = event.duration_minutes ?? 0;
    const existing = eventMap.get(event.session_date) ?? 0;
    eventMap.set(event.session_date, Math.max(existing, minutes));
  });

  const overrideMap = new Map<string, { status: string; reason: string }>();
  overrides.forEach((override) => {
    overrideMap.set(override.session_date, {
      status: override.status,
      reason: override.reason ?? "",
    });
  });

  const checkInMap = new Map<string, string>();
  selfCheckIns.forEach((row) => {
    checkInMap.set(row.session_date, row.method ?? "self_checkin");
  });

  const dates = Array.from(
    new Set([
      ...Array.from(eventMap.keys()),
      ...Array.from(overrideMap.keys()),
      ...Array.from(checkInMap.keys()),
    ]),
  ).sort((a, b) => (a < b ? 1 : -1));

  return dates.map((date) => {
    const override = overrideMap.get(date);
    if (override) {
      return {
        session_date: date,
        status: override.status,
        minutes: eventMap.get(date) ?? 0,
        source: "override",
        note: override.reason || "Admin override",
      };
    }
    const minutes = eventMap.get(date);
    if (minutes !== undefined) {
      const status = minutes >= minMinutes ? "present" : "absent";
      return {
        session_date: date,
        status,
        minutes,
        source: "zoom",
        note: minutes ? `Stayed ${minutes} mins` : "No join detected",
      };
    }
    const method = checkInMap.get(date);
    if (method === "zoom_webhook") {
      return {
        session_date: date,
        status: "present",
        minutes: 0,
        source: "zoom",
        note: "Verified by Zoom",
      };
    }
    return {
      session_date: date,
      status: "pending",
      minutes: 0,
      source: "self_checkin",
      note: "Checked in — awaiting Zoom verification",
    };
  });
}

export function computeStreak(rows: AttendanceRow[]): number {
  let count = 0;
  for (const row of rows) {
    if (row.status === "present") {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

export function computeAttendanceRate(rows: AttendanceRow[]): number {
  if (rows.length === 0) return 0;
  const present = rows.filter((row) => row.status === "present").length;
  return Math.round((present / rows.length) * 100);
}
