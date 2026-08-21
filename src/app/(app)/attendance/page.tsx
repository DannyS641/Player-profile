"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAttendanceSummary } from "@/lib/useAttendanceSummary";

export default function AttendancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUserId(data.user?.id ?? null);
        setAuthResolved(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const { rows, loading, minMinutes, streak, attendanceRate } =
    useAttendanceSummary(userId);

  if (!authResolved || (userId && loading)) {
    return <p className="text-sm text-muted">Loading attendance...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] card-soft bg-white p-8">
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <Flame className="h-4 w-4 text-accent" />
            Current streak
          </div>
          <p className="mt-3 font-display text-6xl tracking-tight text-foreground">
            {streak}
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak === 1 ? "session in a row" : "sessions in a row"}
          </p>
        </div>
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <TrendingUp className="h-4 w-4 text-accent" />
            Attendance rate
          </div>
          <p className="mt-3 font-display text-6xl tracking-tight text-foreground">
            {attendanceRate}%
          </p>
          <p className="mt-1 text-sm text-muted">across all recorded sessions</p>
        </div>
      </div>

      <div className="card-soft rounded-[28px] bg-white p-6 sm:p-8">
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
          <thead className="bg-[#f4f8f6] text-xs uppercase tracking-[0.2em] text-muted">
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
                          : row.status === "pending"
                            ? "bg-[#fff7e6] text-[#8a5a00]"
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
    </div>
  );
}
