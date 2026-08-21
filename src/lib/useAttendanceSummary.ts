"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type AttendanceRow = {
  session_date: string;
  status: string;
  minutes: number;
  source: string;
  note: string;
};

export function useAttendanceSummary(userId: string | null) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [minMinutes, setMinMinutes] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!userId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;

      const { data: settings } = await supabase
        .from("app_settings")
        .select("min_minutes")
        .eq("id", 1)
        .single();

      const eventFilter = email
        ? `player_id.eq.${userId},participant_email.ilike.${email}`
        : `player_id.eq.${userId}`;

      const { data: events } = await supabase
        .from("attendance_events")
        .select("session_date, duration_minutes, joined_at, left_at")
        .or(eventFilter)
        .order("session_date", { ascending: false });

      const { data: overrides } = await supabase
        .from("attendance_overrides")
        .select("session_date, status, reason")
        .eq("player_id", userId)
        .order("session_date", { ascending: false });

      const { data: selfCheckIns } = await supabase
        .from("attendance")
        .select("session_date, method")
        .eq("player_id", userId)
        .order("session_date", { ascending: false });

      const eventMap = new Map<string, number>();
      (events ?? []).forEach((event) => {
        const minutes = event.duration_minutes ?? 0;
        const existing = eventMap.get(event.session_date) ?? 0;
        eventMap.set(event.session_date, Math.max(existing, minutes));
      });

      const overrideMap = new Map<string, { status: string; reason: string }>();
      (overrides ?? []).forEach((override) => {
        overrideMap.set(override.session_date, {
          status: override.status,
          reason: override.reason ?? "",
        });
      });

      const checkInMap = new Map<string, string>();
      (selfCheckIns ?? []).forEach((row) => {
        checkInMap.set(row.session_date, row.method ?? "self_checkin");
      });

      const dates = Array.from(
        new Set([
          ...Array.from(eventMap.keys()),
          ...Array.from(overrideMap.keys()),
          ...Array.from(checkInMap.keys()),
        ]),
      ).sort((a, b) => (a < b ? 1 : -1));

      const minimum = settings?.min_minutes ?? 10;
      if (isMounted) {
        setMinMinutes(minimum);
        setRows(
          dates.map((date) => {
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
              const status = minutes >= minimum ? "present" : "absent";
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
          }),
        );
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const streak = useMemo(() => {
    let count = 0;
    for (const row of rows) {
      if (row.status === "present") {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [rows]);

  const attendanceRate = useMemo(() => {
    if (rows.length === 0) return 0;
    const present = rows.filter((row) => row.status === "present").length;
    return Math.round((present / rows.length) * 100);
  }, [rows]);

  return { rows, loading, minMinutes, streak, attendanceRate };
}
