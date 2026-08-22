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

  const { rows, loading, minMinutes, streak, attendanceRate, error } =
    useAttendanceSummary(userId);

  if (!authResolved || (userId && loading)) {
    return <p className="text-sm text-muted">Loading attendance...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] card-soft bg-card p-8">
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
      {error ? (
        <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <Flame className="h-4 w-4 text-accent-2" />
            Current streak
          </div>
          <p className="mt-3 font-display text-4xl tracking-tight text-foreground">
            {streak}
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak === 1 ? "session in a row" : "sessions in a row"}
          </p>
        </div>
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <TrendingUp className="h-4 w-4 text-accent-2" />
            Attendance rate
          </div>
          <p className="mt-3 font-display text-4xl tracking-tight text-foreground">
            {attendanceRate}%
          </p>
          <p className="mt-1 text-sm text-muted">across all recorded sessions</p>
        </div>
      </div>

      <div className="card-soft rounded-[28px] bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Attendance</h1>
            <p className="text-sm text-muted">
              Verified attendance based on Zoom (min {minMinutes} mins).
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 whitespace-nowrap rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
          >
            Back to profile
          </Link>
        </div>

        <div className="mt-6 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No verified attendance yet.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.session_date}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-row)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {row.session_date}
                  </p>
                  <p className="truncate text-xs text-muted">{row.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === "present"
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : row.status === "pending"
                          ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                          : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.minutes > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      {row.minutes} min · {row.source}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs capitalize text-muted">
                      {row.source}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
