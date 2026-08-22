"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  buildAttendanceRows,
  computeStreak,
  computeAttendanceRate,
  type AttendanceRow,
} from "@/lib/attendance";

export type { AttendanceRow };

export function useAttendanceSummary(userId: string | null) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [minMinutes, setMinMinutes] = useState(10);
  const [error, setError] = useState<string | null>(null);

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

      const { data: events, error: eventsError } = await supabase
        .from("attendance_events")
        .select("session_date, duration_minutes, joined_at, left_at")
        .or(eventFilter)
        .order("session_date", { ascending: false });

      const { data: overrides, error: overridesError } = await supabase
        .from("attendance_overrides")
        .select("session_date, status, reason")
        .eq("player_id", userId)
        .order("session_date", { ascending: false });

      const { data: selfCheckIns, error: checkInsError } = await supabase
        .from("attendance")
        .select("session_date, method")
        .eq("player_id", userId)
        .order("session_date", { ascending: false });

      const minimum = settings?.min_minutes ?? 10;
      if (isMounted) {
        setMinMinutes(minimum);
        setRows(
          buildAttendanceRows({
            events: events ?? [],
            overrides: overrides ?? [],
            selfCheckIns: selfCheckIns ?? [],
            minMinutes: minimum,
          }),
        );
        setError(
          eventsError || overridesError || checkInsError
            ? "Couldn't load attendance. Check your connection and try again."
            : null,
        );
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const streak = useMemo(() => computeStreak(rows), [rows]);
  const attendanceRate = useMemo(() => computeAttendanceRate(rows), [rows]);

  return { rows, loading, minMinutes, streak, attendanceRate, error };
}
