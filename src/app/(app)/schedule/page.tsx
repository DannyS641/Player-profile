"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toISODate, isSameDay } from "@/lib/dateUtils";
import {
  scheduleReminderNotification,
  cancelReminderNotification,
} from "@/lib/reminderNotifications";
import { usePrompt } from "@/components/PromptDialog";
import { useConfirm } from "@/components/ConfirmDialog";

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

type Reminder = {
  id: string;
  event_date: string;
  title: string;
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const dayAbbr = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function SchedulePage() {
  const prompt = usePrompt();
  const confirm = useConfirm();
  const [userId, setUserId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (isMounted) {
        setUserId(userData.user?.id ?? null);
      }

      const { data, error: scheduleError } = await supabase
        .from("weekly_schedule")
        .select("id, day_of_week, period, title, time, venue, notes, sort_order")
        .order("day_of_week", { ascending: true })
        .order("sort_order", { ascending: true });

      if (isMounted) {
        setSchedule((data as ScheduleItem[]) ?? []);
        if (scheduleError) {
          setLoadError("Couldn't load the schedule. Check your connection and try again.");
        }
      }

      if (userData.user) {
        const { data: reminderData, error: reminderError } = await supabase
          .from("personal_reminders")
          .select("id, event_date, title")
          .eq("player_id", userData.user.id)
          .order("event_date", { ascending: true });

        if (isMounted) {
          setReminders((reminderData as Reminder[]) ?? []);
          if (reminderError && !scheduleError) {
            setLoadError("Couldn't load your reminders. Check your connection and try again.");
          }
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const today = new Date();

  const monthCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
    return cells;
  }, [viewMonth]);

  const reminderDates = useMemo(
    () => new Set(reminders.map((r) => r.event_date)),
    [reminders],
  );

  const itemsForSelectedDay = useMemo(
    () => schedule.filter((item) => item.day_of_week === selectedDate.getDay()),
    [schedule, selectedDate],
  );

  const remindersForSelectedDay = useMemo(
    () => reminders.filter((r) => r.event_date === toISODate(selectedDate)),
    [reminders, selectedDate],
  );

  const goPrevMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const handleAddReminder = async () => {
    if (!userId) {
      return;
    }
    const title = await prompt({
      title: "Add reminder",
      label: `For ${selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      placeholder: "e.g. Extra shooting practice",
      confirmLabel: "Add",
    });
    if (!title) {
      return;
    }

    setActionError(null);
    const { data, error } = await supabase
      .from("personal_reminders")
      .insert({
        player_id: userId,
        event_date: toISODate(selectedDate),
        title,
      })
      .select("id, event_date, title")
      .single();

    if (!error && data) {
      setReminders((current) => [...current, data as Reminder]);
      scheduleReminderNotification(data as Reminder);
    } else {
      setActionError("Couldn't save that reminder. Check your connection and try again.");
    }
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    const confirmed = await confirm({
      title: "Delete this reminder?",
      description: reminder.title,
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!confirmed) {
      return;
    }

    setActionError(null);
    const { error } = await supabase
      .from("personal_reminders")
      .delete()
      .eq("id", reminder.id);

    if (!error) {
      setReminders((current) => current.filter((r) => r.id !== reminder.id));
      cancelReminderNotification(reminder.id);
    } else {
      setActionError("Couldn't delete that reminder. Check your connection and try again.");
    }
  };

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </p>
      ) : null}
      <div className="rounded-[28px] card-soft bg-card p-6 sm:p-8">
        <h2 className="font-display text-lg">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
          Team schedule
        </p>
        {itemsForSelectedDay.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing scheduled for {dayNames[selectedDate.getDay()]}.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {itemsForSelectedDay.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-row)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted">
                    {item.time ? item.time : "Time TBD"}
                    {item.venue ? ` · ${item.venue}` : ""}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-muted">{item.notes}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  {item.period}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
            Your reminders
          </p>
          {userId ? (
            <button
              type="button"
              onClick={handleAddReminder}
              className="flex items-center gap-1 rounded-full bg-accent-2/10 px-3 py-1.5 text-xs font-semibold text-accent-2 transition hover:bg-accent-2/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          ) : null}
        </div>
        {actionError ? (
          <p className="mt-2 text-xs text-[var(--danger)]">{actionError}</p>
        ) : null}
        {remindersForSelectedDay.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No reminders for this day.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {remindersForSelectedDay.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-row)] px-4 py-3"
              >
                <p className="min-w-0 flex-1 font-semibold text-foreground">
                  {reminder.title}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(reminder)}
                  aria-label="Delete reminder"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-card hover:text-[var(--danger)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] card-soft bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl">
            {viewMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-row)] text-foreground transition hover:bg-[var(--surface-soft)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-row)] text-foreground transition hover:bg-[var(--surface-soft)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-tight text-muted">
          {dayAbbr.map((abbr) => (
            <div key={abbr}>{abbr}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthCells.map((date, idx) => {
            if (!date) {
              return <div key={`blank-${idx}`} />;
            }
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const hasReminder = reminderDates.has(toISODate(date));
            return (
              <button
                key={toISODate(date)}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-semibold transition ${
                  isSelected
                    ? "bg-accent-2 text-white"
                    : "text-foreground hover:bg-[var(--surface-row)]"
                }`}
              >
                {date.getDate()}
                {isToday || hasReminder ? (
                  <span
                    className={`h-1 w-1 rounded-full ${
                      isSelected
                        ? "bg-card"
                        : hasReminder
                          ? "bg-accent-2"
                          : "bg-muted"
                    }`}
                  />
                ) : (
                  <span className="h-1 w-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
