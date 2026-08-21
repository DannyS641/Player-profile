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
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getCheckinLocation, distanceMeters } from "@/lib/checkinLocation";
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
  const [venue, setVenue] = useState<{
    lat: number | null;
    lng: number | null;
    radiusM: number;
  }>({ lat: null, lng: null, radiusM: 150 });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

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

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

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
        .select("zoom_link, min_minutes, venue_lat, venue_lng, venue_radius_m")
        .eq("id", 1)
        .single();

      if (isMounted) {
        setZoomLink(settings?.zoom_link ?? null);
        setMinMinutes(settings?.min_minutes ?? 10);
        setVenue({
          lat: settings?.venue_lat ?? null,
          lng: settings?.venue_lng ?? null,
          radiusM: settings?.venue_radius_m ?? 150,
        });
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

  const { streak, attendanceRate } = useAttendanceSummary(userId);

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

    let locationNote = "";
    if (location && venue.lat !== null && venue.lng !== null) {
      const distance = Math.round(
        distanceMeters(location.lat, location.lng, venue.lat, venue.lng),
      );
      locationNote =
        distance <= venue.radiusM
          ? ` Confirmed ${distance}m from venue.`
          : ` You appear to be ${distance}m from venue — check-in recorded but flagged for review.`;
    } else if (!location) {
      locationNote = " Location wasn't available, so this check-in is unverified by location.";
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
      <div className="rounded-[28px] card-soft bg-white p-8">
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
      {/* Header */}
      <div className="card-soft flex flex-col items-center gap-4 rounded-[28px] bg-white p-6 text-center sm:flex-row sm:text-left">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 128 128"
            aria-hidden="true"
          >
            <circle cx="64" cy="64" r="60" fill="none" stroke="#dbe4de" strokeWidth="6" />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 60}
              strokeDashoffset={2 * Math.PI * 60 * (1 - completeness / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#e3ece6] shadow-md">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt="Profile"
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <span className="text-sm font-semibold text-muted">
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl">
            {profile.full_name || "Player name"}
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {profile.position || "Position"} · {profile.team}
          </p>
        </div>
        {completeness < 100 ? (
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent/15"
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <Flame className="h-4 w-4 text-accent" />
            Streak
          </div>
          <p className="mt-3 font-display text-5xl tracking-tight text-foreground">
            {streak}
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak === 1 ? "session in a row" : "sessions in a row"}
          </p>
        </div>
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <TrendingUp className="h-4 w-4 text-accent" />
            Attendance
          </div>
          <p className="mt-3 font-display text-5xl tracking-tight text-foreground">
            {attendanceRate}%
          </p>
          <Link
            href="/attendance"
            className="mt-1 inline-block text-sm text-muted underline-offset-2 hover:underline"
          >
            View history
          </Link>
        </div>
        <div className="card-soft card-tonal rounded-[28px] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <CalendarDays className="h-4 w-4 text-accent" />
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
      </div>

      {/* Check-in + details */}
      <div className="grid gap-6 lg:grid-cols-2">
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
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-background/80">
            {zoomLink ? "Zoom link is ready." : "Zoom link pending from admin."}
          </div>
          <button
            type="button"
            onClick={handleCheckIn}
            className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#08150e]"
          >
            Join Zoom and mark present
          </button>
          {message ? (
            <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-xs text-background/90">
              {message}
            </p>
          ) : null}
        </div>

        <div className="card-soft rounded-[28px] bg-white p-6 sm:p-7">
          <h3 className="font-display text-lg">Your details</h3>
          <div className="mt-4 space-y-2">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-2xl bg-[#f4f8f6] px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent">
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
          <p className="mt-4 text-xs text-muted">
            COLLEGE OF INTEREST:{" "}
            <span className="font-semibold text-foreground">
              {profile.colleges_of_interest || "Not set"}
            </span>
          </p>
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex items-center gap-3">
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
    </div>
  );
}
