"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ruler,
  Weight,
  Hand,
  ArrowLeftRight,
  Phone,
  Flame,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getCheckinLocation } from "@/lib/checkinLocation";
import { useAttendanceSummary } from "@/lib/useAttendanceSummary";

type ProfileForm = {
  full_name: string;
  position: string;
  team: string;
  jersey_number: string;
  height: string;
  weight: string;
  dominant_hand: string;
  wingspan: string;
  phone: string;
  photo_url: string;
  instagram_url: string;
  tiktok_url: string;
  colleges_of_interest: string;
};

type ScheduleItem = {
  id: string;
  day_of_week: number;
  period: "morning" | "afternoon" | "evening";
  title: string;
  time: string | null;
  venue: string | null;
  sort_order: number;
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

const emptyProfile: ProfileForm = {
  full_name: "",
  position: "",
  team: "A5",
  jersey_number: "",
  height: "",
  weight: "",
  dominant_hand: "",
  wingspan: "",
  phone: "",
  photo_url: "",
  instagram_url: "",
  tiktok_url: "",
  colleges_of_interest: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [zoomLink, setZoomLink] = useState<string | null>(null);
  const [minMinutes, setMinMinutes] = useState(10);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

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

      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      // PGRST116 just means "no profile row yet" (new player, headed to
      // onboarding) — anything else is a real fetch failure worth surfacing,
      // since it would otherwise look identical to an empty profile.
      if (profileError && profileError.code !== "PGRST116" && isMounted) {
        setLoadError("Couldn't load your profile. Check your connection and try again.");
      }

      if (existingProfile && isMounted) {
        setProfile({
          full_name: existingProfile.full_name ?? "",
          position: existingProfile.position ?? "",
          team: existingProfile.team ?? "A5",
          jersey_number: existingProfile.jersey_number ?? "",
          height: existingProfile.height ?? "",
          weight: existingProfile.weight ?? "",
          dominant_hand: existingProfile.dominant_hand ?? "",
          wingspan: existingProfile.wingspan ?? "",
          phone: existingProfile.phone ?? "",
          photo_url: existingProfile.photo_url ?? "",
          instagram_url: existingProfile.instagram_url ?? "",
          tiktok_url: existingProfile.tiktok_url ?? "",
          colleges_of_interest: existingProfile.colleges_of_interest ?? "",
        });
      }

      const { data: settings } = await supabase
        .from("app_settings")
        .select("zoom_link, min_minutes")
        .eq("id", 1)
        .single();

      if (isMounted) {
        setZoomLink(settings?.zoom_link ?? null);
        setMinMinutes(settings?.min_minutes ?? 10);
      }

      const { data: scheduleData } = await supabase
        .from("weekly_schedule")
        .select("id, day_of_week, period, title, time, venue, sort_order")
        .order("day_of_week", { ascending: true })
        .order("sort_order", { ascending: true });

      if (isMounted) {
        setSchedule((scheduleData as ScheduleItem[]) ?? []);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const { rows: attendanceRows, streak, attendanceRate } = useAttendanceSummary(userId);

  const recentDays = useMemo(() => {
    return [...attendanceRows].slice(0, 7).reverse();
  }, [attendanceRows]);

  const nextSession = useMemo(() => {
    if (schedule.length === 0) return null;
    const todayIdx = new Date().getDay();
    const sorted = [...schedule].sort(
      (a, b) => a.day_of_week - b.day_of_week || a.sort_order - b.sort_order,
    );
    return (
      sorted.find((item) => item.day_of_week >= todayIdx) ?? sorted[0] ?? null
    );
  }, [schedule]);

  const handleCheckIn = async () => {
    if (!userId) {
      setMessage("Please log in to check in.");
      return;
    }

    if (!zoomLink) {
      setMessage("Zoom link not set by admin yet.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const location = await getCheckinLocation();

    const { error: checkInError } = await supabase.from("attendance").upsert(
      {
        player_id: userId,
        session_date: today,
        method: location ? "self_checkin" : "self_checkin_no_location",
        checkin_lat: location?.lat ?? null,
        checkin_lng: location?.lng ?? null,
        checkin_accuracy_m: location?.accuracyM ?? null,
      },
      { onConflict: "player_id,session_date", ignoreDuplicates: true },
    );

    if (checkInError) {
      setMessage(`Could not record check-in: ${checkInError.message}`);
      return;
    }

    // Distance/flag is computed server-side (see compute_checkin_flag trigger),
    // not trusted from anything calculated on this device.
    const { data: recorded } = await supabase
      .from("attendance")
      .select("checkin_distance_m, checkin_flagged")
      .eq("player_id", userId)
      .eq("session_date", today)
      .single();

    let locationNote = "";
    if (!location) {
      locationNote = " Location wasn't available, so this check-in is unverified by location.";
    } else if (recorded?.checkin_distance_m != null) {
      const distance = Math.round(recorded.checkin_distance_m);
      locationNote = recorded.checkin_flagged
        ? ` You appear to be ${distance}m from venue — check-in recorded but flagged for review.`
        : ` Confirmed ${distance}m from venue.`;
    }

    setMessage(
      `Check-in recorded. Stay in Zoom at least ${minMinutes} minutes for verified attendance.${locationNote}`,
    );
    window.open(zoomLink, "_blank", "noopener,noreferrer");
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A5";

  const normalizeUrl = (value: string) => {
    if (!value) return "";
    return value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
  };

  const completeness = useMemo(() => {
    const fields = [
      profile.photo_url,
      profile.height,
      profile.weight,
      profile.dominant_hand,
      profile.wingspan,
      profile.phone,
      profile.colleges_of_interest,
      profile.instagram_url || profile.tiktok_url,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  if (loading) {
    return <p className="text-sm text-muted">Loading your dashboard...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] card-soft bg-card p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to view your dashboard.
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

  const socialLinks = [
    {
      label: "Instagram",
      url: normalizeUrl(profile.instagram_url),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm5.4-.6a1.1 1.1 0 1 1-2.2 0a1.1 1.1 0 0 1 2.2 0Z"
          />
        </svg>
      ),
    },
    {
      label: "TikTok",
      url: normalizeUrl(profile.tiktok_url),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M16.5 3c.6 2 2.2 3.6 4.2 4.2v3.3c-1.5-.1-3-.6-4.2-1.4v6.2a5.9 5.9 0 1 1-5.9-5.9c.5 0 1 .1 1.5.2v3.2a2.7 2.7 0 1 0 2.1 2.6V3h2.3Z"
          />
        </svg>
      ),
    },
  ].filter((item) => item.url);

  const detailRows = [
    { icon: Ruler, label: "Height", value: profile.height },
    { icon: Weight, label: "Weight", value: profile.weight },
    { icon: Hand, label: "Dominant hand", value: profile.dominant_hand },
    { icon: ArrowLeftRight, label: "Wingspan", value: profile.wingspan },
    { icon: Phone, label: "Phone", value: profile.phone },
  ];

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </p>
      ) : null}
      {/* Header */}
      <div className="card-soft flex flex-col items-center gap-4 rounded-[28px] bg-card p-6 text-center sm:flex-row sm:text-left">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 128 128"
            aria-hidden="true"
          >
            <circle cx="64" cy="64" r="60" fill="none" stroke="var(--line)" strokeWidth="6" />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="var(--accent-2)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 60}
              strokeDashoffset={2 * Math.PI * 60 * (1 - completeness / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-[var(--surface-soft-focus)] shadow-md">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt="Profile"
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <span className="text-lg font-semibold text-muted">
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl">
            {profile.full_name || "Player name"}
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.15em] text-muted">
            {profile.position || "Position"} · {profile.team}
          </p>
        </div>
        {completeness < 100 ? (
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent-2/10 px-4 py-1.5 text-[11px] font-semibold text-accent-2 transition hover:bg-accent-2/15"
          >
            Complete your profile · {completeness}%
          </Link>
        ) : (
          <Link
            href="/settings"
            className="inline-flex shrink-0 rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
          >
            Edit profile
          </Link>
        )}
      </div>

      {/* Next session */}
      <div className="card-soft card-tonal rounded-[28px] p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <CalendarDays className="h-4 w-4 text-accent-2" />
          Next session
        </div>
        {nextSession ? (
          <>
            <p className="mt-3 font-display text-2xl tracking-tight text-foreground">
              {nextSession.day_of_week === new Date().getDay()
                ? "Today"
                : dayNames[nextSession.day_of_week]}
            </p>
            <p className="mt-1 text-sm text-muted">
              {nextSession.title}
              {nextSession.time ? ` · ${nextSession.time}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">No schedule published yet.</p>
        )}
        <Link
          href="/schedule"
          className="mt-1 inline-block text-sm text-muted underline-offset-2 hover:underline"
        >
          View schedule
        </Link>
      </div>

      {/* Streak + attendance + details */}
      <div className="card-soft rounded-[28px] bg-card p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-lg">Streak</h3>
            <span className="text-sm text-muted">
              {streak} {streak === 1 ? "session" : "sessions"} in a row
            </span>
          </div>
          <Link
            href="/attendance"
            className="text-sm text-muted underline-offset-2 hover:underline"
          >
            View history
          </Link>
        </div>
        {recentDays.length > 0 ? (
          <>
            <div className="mt-4 flex items-center gap-2 overflow-x-auto">
              {recentDays.map((row) => {
                const dayNum = new Date(row.session_date).getDate();
                const present = row.status === "present";
                return (
                  <div
                    key={row.session_date}
                    title={`${row.session_date} — ${present ? "attended" : "not attended"}`}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      present
                        ? "bg-accent-2/10 text-accent-2"
                        : "border border-line text-muted"
                    }`}
                  >
                    {present ? <Flame className="h-4 w-4" /> : dayNum}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              <Flame className="mb-0.5 inline h-3 w-3 text-accent-2" /> attended
              &nbsp;·&nbsp; plain number = day of month, not attended
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">No sessions recorded yet.</p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="relative mx-auto flex h-32 w-32 shrink-0 items-center justify-center sm:mx-0">
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 128 128"
              aria-hidden="true"
            >
              <circle cx="64" cy="64" r="56" fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="var(--accent-2)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - attendanceRate / 100)}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                Attendance
              </p>
              <p className="font-display text-3xl text-foreground">
                {attendanceRate}%
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-row)] px-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-accent-2">
                  <row.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
                  {row.label}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {row.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            COLLEGE OF INTEREST:{" "}
            <span className="font-semibold text-foreground">
              {profile.colleges_of_interest || "Not set"}
            </span>
          </p>
          {socialLinks.length > 0 ? (
            <div className="flex items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-foreground hover:text-foreground"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Check-in */}
      <div className="card-soft rounded-[28px] bg-foreground p-6 text-background sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/70">
          Training session
        </p>
        <h2 className="mt-3 font-display text-2xl">
          Join training and check in.
        </h2>
        <p className="mt-3 text-sm text-background/80">
          Clicking the button records your attendance before opening Zoom.
        </p>
        <div className="mt-4 rounded-2xl border border-background/20 bg-background/5 px-4 py-3 text-xs text-background/80">
          {zoomLink ? "Zoom link is ready." : "Zoom link pending from admin."}
        </div>
        <button
          type="button"
          onClick={handleCheckIn}
          className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background transition hover:bg-[var(--ink-hover)]"
        >
          Join Zoom and mark present
        </button>
        {message ? (
          <p className="mt-4 rounded-2xl bg-background/10 px-4 py-3 text-xs text-background/90">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
