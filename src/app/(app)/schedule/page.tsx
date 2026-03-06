"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ScheduleItem = {
  id: string;
  day_of_week: number;
  period: "morning" | "afternoon" | "evening";
  title: string;
  time: string | null;
  venue: string | null;
  notes: string | null;
  sort_order: number;
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("weekly_schedule")
        .select("id, day_of_week, period, title, time, venue, notes, sort_order")
        .order("day_of_week", { ascending: true })
        .order("sort_order", { ascending: true });

      if (isMounted) {
        setSchedule((data as ScheduleItem[]) ?? []);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h1 className="font-display text-3xl">Weekly schedule</h1>
        <p className="mt-2 text-sm text-muted">
          Training and events for the week.
        </p>
      </div>

      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        {schedule.length === 0 ? (
          <p className="text-sm text-muted">
            No schedule has been published yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-line bg-[#fbf8f2] p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {dayNames[item.day_of_week] ?? "Day"}
                </p>
                <h3 className="mt-2 font-display text-lg">{item.title}</h3>
                <p className="text-sm text-muted">
                  {item.period ? `Period: ${item.period}` : "Period: TBD"} ·{" "}
                  {item.time ? `Time: ${item.time}` : "Time: TBD"} ·{" "}
                  {item.venue ? `Venue: ${item.venue}` : "Venue: TBD"}
                </p>
                {item.notes ? (
                  <p className="mt-2 text-xs text-muted">{item.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
