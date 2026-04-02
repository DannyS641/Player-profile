"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type AttendanceRow = {
  session_date: string;
  status: string;
  minutes: number;
  source: string;
  note: string;
};

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [minMinutes, setMinMinutes] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setUserId(userData.user.id);
      }

      const { data: settings } = await supabase
        .from("app_settings")
        .select("min_minutes")
        .eq("id", 1)
        .single();

      const eventFilter =
        userData.user.email && userData.user.id
          ? `player_id.eq.${userData.user.id},participant_email.ilike.${userData.user.email}`
          : userData.user.id
            ? `player_id.eq.${userData.user.id}`
            : "";

      const { data: events } = await supabase
        .from("attendance_events")
        .select("session_date, duration_minutes, joined_at, left_at")
        .or(eventFilter)
        .order("session_date", { ascending: false });

      const { data: overrides } = await supabase
        .from("attendance_overrides")
        .select("session_date, status, reason")
        .eq("player_id", userData.user.id)
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

      const dates = Array.from(
        new Set([
          ...Array.from(eventMap.keys()),
          ...Array.from(overrideMap.keys()),
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
            const minutes = eventMap.get(date) ?? 0;
            const status = minutes >= minimum ? "present" : "absent";
            return {
              session_date: date,
              status,
              minutes,
              source: "zoom",
              note: minutes
                ? `Stayed ${minutes} mins`
                : "No join detected",
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
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Loading attendance...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to view attendance.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl">Attendance</h1>
        <p className="text-sm text-muted">
          Verified attendance based on Zoom (min {minMinutes} mins).
        </p>
      </div>
        <Link
          href="/profile"
          className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
        >
          Back to profile
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full w-full text-left text-sm sm:min-w-[680px]">
          <thead className="bg-[#f9f6f1] text-xs uppercase tracking-[0.2em] text-muted">
            <tr>
              <th className="px-4 py-3">Session date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Minutes</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  No verified attendance yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.session_date}
                  className="border-t border-line text-sm"
                >
                  <td className="px-4 py-4">{row.session_date}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === "present"
                          ? "bg-[#e7f7ea] text-[#1c5924]"
                          : "bg-[#fff4f0] text-[#8f2b18]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{row.minutes}</td>
                  <td className="px-4 py-4 capitalize">{row.source}</td>
                  <td className="px-4 py-4 break-words text-muted">
                    {row.note}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
