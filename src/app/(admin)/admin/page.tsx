"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Player = {
  id: string;
  email: string;
  full_name: string;
  position: string;
  team: string;
  jersey_number: string;
  height: string;
  weight: string;
  dominant_hand: string;
  wingspan: string;
  colleges_of_interest: string;
  phone: string;
  photo_url: string;
  instagram_url: string;
  tiktok_url: string;
  bio: string;
  status: string;
  role: string;
  updated_at: string;
};

type AttendanceRow = {
  id: string;
  player_id: string | null;
  session_date: string;
  participant_email: string | null;
  meeting_id: string | null;
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number | null;
  source: string | null;
};

type OverrideRow = {
  player_id: string;
  session_date: string;
  status: string;
  reason: string;
};

type ResourceRow = {
  id: string;
  type: "film" | "youtube";
  title: string;
  url: string;
  description: string | null;
};

type ScheduleRow = {
  id: string;
  day_of_week: number;
  period: "morning" | "afternoon" | "evening";
  title: string;
  time: string | null;
  venue: string | null;
  notes: string | null;
  sort_order: number;
};

type MediaFile = {
  path: string;
  name: string;
  userId: string;
  created_at: string | null;
  signedUrl: string | null;
};

const statuses = ["active", "inactive", "suspended"];

const toCsv = (rows: Record<string, string | number | null | undefined>[]) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "")
      .replaceAll('"', '""')
      .replaceAll("\n", " ")}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ];
  return lines.join("\n");
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const buildDateRange = (days: number) => {
  const today = new Date();
  const range: { key: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    range.push({ key, label, count: 0 });
  }
  return range;
};

export default function AdminPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [docFiles, setDocFiles] = useState<{ path: string; name: string; userId: string }[]>([]);
  const [docFilter, setDocFilter] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sessionSettings, setSessionSettings] = useState({
    zoom_link: "",
    meeting_id: "",
    session_time: "04:00:00",
    session_tz: "Africa/Lagos",
    min_minutes: 10,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [overridePlayerId, setOverridePlayerId] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStatus, setOverrideStatus] = useState("present");
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    type: "film",
    title: "",
    url: "",
    description: "",
  });
  const [savingResource, setSavingResource] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 1,
    period: "morning",
    title: "",
    time: "",
    venue: "",
    notes: "",
    sort_order: 1,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (isMounted) {
        setIsAdmin(profile?.role === "admin");
      }

      if (profile?.role !== "admin") {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      const { data: playersData } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, position, team, jersey_number, height, weight, dominant_hand, wingspan, colleges_of_interest, phone, photo_url, instagram_url, tiktok_url, bio, status, role, updated_at",
        )
        .order("updated_at", { ascending: false });

      const { data: settings } = await supabase
        .from("app_settings")
        .select("zoom_link, meeting_id, session_time, session_tz, min_minutes")
        .eq("id", 1)
        .single();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      const startKey = startDate.toISOString().slice(0, 10);

      const { data: attendanceEvents } = await supabase
        .from("attendance_events")
        .select(
          "id, player_id, session_date, participant_email, meeting_id, joined_at, left_at, duration_minutes, source",
        )
        .gte("session_date", startKey)
        .order("session_date", { ascending: true });

      const { data: overrideData } = await supabase
        .from("attendance_overrides")
        .select("player_id, session_date, status, reason")
        .order("session_date", { ascending: false })
        .limit(50);

      const { data: resourceData } = await supabase
        .from("education_resources")
        .select("id, type, title, url, description")
        .order("created_at", { ascending: false });

      const { data: scheduleData } = await supabase
        .from("weekly_schedule")
        .select("id, day_of_week, period, title, time, venue, notes, sort_order")
        .order("day_of_week", { ascending: true })
        .order("sort_order", { ascending: true });

      const docResults: { path: string; name: string; userId: string }[] = [];
      const mediaResults: Omit<MediaFile, "signedUrl">[] = [];
      for (const player of playersData ?? []) {
        const userId = (player as Player).id;
        const { data: files } = await supabase.storage
          .from("documents")
          .list(userId, { limit: 25 });
        (files ?? []).forEach((file) => {
          docResults.push({
            userId,
            name: file.name,
            path: `${userId}/${file.name}`,
          });
        });

        const { data: media } = await supabase.storage
          .from("media-dump")
          .list(userId, {
            limit: 25,
            sortBy: { column: "created_at", order: "desc" },
          });
        (media ?? []).forEach((file) => {
          mediaResults.push({
            userId,
            name: file.name,
            path: `${userId}/${file.name}`,
            created_at: file.created_at ?? null,
          });
        });
      }

      const mediaUrls = await Promise.all(
        mediaResults.map(async (file) => {
          const { data } = await supabase.storage
            .from("media-dump")
            .createSignedUrl(file.path, 3600);
          return {
            path: file.path,
            signedUrl: data?.signedUrl ?? null,
          };
        }),
      );

      if (isMounted) {
        setPlayers((playersData as Player[]) ?? []);
        setAttendance((attendanceEvents as AttendanceRow[]) ?? []);
        setOverrides((overrideData as OverrideRow[]) ?? []);
        setResources((resourceData as ResourceRow[]) ?? []);
        setSchedule((scheduleData as ScheduleRow[]) ?? []);
        setDocFiles(docResults);
        setMediaFiles(
          mediaResults.map((file) => ({
            ...file,
            signedUrl:
              mediaUrls.find((item) => item.path === file.path)?.signedUrl ?? null,
          })),
        );
        setSessionSettings({
          zoom_link: settings?.zoom_link ?? "",
          meeting_id: settings?.meeting_id ?? "",
          session_time: settings?.session_time ?? "04:00:00",
          session_tz: settings?.session_tz ?? "Africa/Lagos",
          min_minutes: settings?.min_minutes ?? 10,
        });
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return players;
    return players.filter((player) =>
      [
        player.email,
        player.full_name,
        player.position,
        player.team,
        player.jersey_number,
        player.height,
        player.weight,
        player.dominant_hand,
        player.wingspan,
        player.colleges_of_interest,
        player.phone,
        player.status,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value)),
    );
  }, [players, query]);

  const playerDocsMap = useMemo(() => {
    const map = new Map<string, { path: string; name: string; userId: string }[]>();
    docFiles.forEach((file) => {
      const list = map.get(file.userId) ?? [];
      list.push(file);
      map.set(file.userId, list);
    });
    return map;
  }, [docFiles]);

  const playerMediaMap = useMemo(() => {
    const map = new Map<string, MediaFile[]>();
    mediaFiles.forEach((file) => {
      const list = map.get(file.userId) ?? [];
      list.push(file);
      map.set(file.userId, list);
    });
    return map;
  }, [mediaFiles]);

  const playerById = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  const visibleDocs = docFilter
    ? docFiles.filter((file) => file.userId === docFilter)
    : docFiles;

  const visibleMedia = mediaFilter
    ? mediaFiles.filter((file) => file.userId === mediaFilter)
    : mediaFiles;

  const attendanceTrend = useMemo(() => {
    const range = buildDateRange(14);
    const index = new Map(range.map((day, i) => [day.key, i]));
    const minMinutes = sessionSettings.min_minutes ?? 10;
    const overrideMap = new Map<string, string>();
    overrides.forEach((override) => {
      overrideMap.set(`${override.player_id}|${override.session_date}`, override.status);
    });

    const counted = new Set<string>();
    attendance.forEach((row) => {
      const key = `${row.player_id}|${row.session_date}`;
      if (overrideMap.has(key)) {
        return;
      }
      const duration = (row as unknown as { duration_minutes?: number })
        .duration_minutes ?? 0;
      if (duration >= minMinutes) {
        const position = index.get(row.session_date);
        if (position !== undefined) {
          range[position].count += 1;
          counted.add(key);
        }
      }
    });

    overrides.forEach((override) => {
      if (override.status !== "present") return;
      const key = `${override.player_id}|${override.session_date}`;
      if (counted.has(key)) return;
      const position = index.get(override.session_date);
      if (position !== undefined) {
        range[position].count += 1;
      }
    });
    return range;
  }, [attendance, overrides, sessionSettings.min_minutes]);

  const stats = useMemo(() => {
    const total = players.length;
    const active = players.filter((player) => player.status === "active").length;
    const inactive = players.filter((player) => player.status === "inactive").length;
    const suspended = players.filter((player) => player.status === "suspended").length;
    return { total, active, inactive, suspended };
  }, [players]);

  const handleStatusChange = async (id: string, status: string) => {
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, status } : player,
      ),
    );
  };

  const handleSettingsSave = async () => {
    setMessage(null);
    setSavingSettings(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({
        id: 1,
        zoom_link: sessionSettings.zoom_link,
        meeting_id: sessionSettings.meeting_id,
        session_time: sessionSettings.session_time,
        session_tz: sessionSettings.session_tz,
        min_minutes: sessionSettings.min_minutes,
        updated_at: new Date().toISOString(),
      });

    setSavingSettings(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Session settings updated.");
  };

  const handleOverrideSave = async () => {
    if (!overridePlayerId || !overrideDate) {
      setMessage("Select a player and date for the override.");
      return;
    }

    setSavingOverride(true);
    const { error } = await supabase
      .from("attendance_overrides")
      .upsert({
        player_id: overridePlayerId,
        session_date: overrideDate,
        status: overrideStatus,
        reason: overrideReason,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      });

    setSavingOverride(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setOverrides((current) => [
      {
        player_id: overridePlayerId,
        session_date: overrideDate,
        status: overrideStatus,
        reason: overrideReason,
      },
      ...current.filter(
        (item) =>
          !(item.player_id === overridePlayerId && item.session_date === overrideDate),
      ),
    ]);
    setMessage("Attendance override saved.");
  };

  const handleResourceSave = async () => {
    if (!resourceForm.title || !resourceForm.url) {
      setMessage("Provide a title and URL for the resource.");
      return;
    }
    setSavingResource(true);
    const { data, error } = await supabase
      .from("education_resources")
      .insert({
        type: resourceForm.type,
        title: resourceForm.title,
        url: resourceForm.url,
        description: resourceForm.description,
      })
      .select()
      .single();
    setSavingResource(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setResources((current) => [data as ResourceRow, ...current]);
    setResourceForm({ type: "film", title: "", url: "", description: "" });
    setMessage("Education resource added.");
  };

  const handleTitleFetch = async () => {
    if (!resourceForm.url) {
      setMessage("Paste a URL before fetching the title.");
      return;
    }
    setFetchingTitle(true);
    setMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage("You need to be logged in.");
      setFetchingTitle(false);
      return;
    }

    const response = await fetch("/api/title-fetcher", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: resourceForm.url }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result?.error || "Failed to fetch title.");
      setFetchingTitle(false);
      return;
    }

    setResourceForm((current) => ({
      ...current,
      title: result?.title ?? current.title,
    }));
    setFetchingTitle(false);
  };

  const handleResourceDelete = async (id: string) => {
    const { error } = await supabase
      .from("education_resources")
      .delete()
      .eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setResources((current) => current.filter((item) => item.id !== id));
  };

  const handleScheduleSave = async () => {
    if (!scheduleForm.title) {
      setMessage("Provide a title for the schedule item.");
      return;
    }
    setSavingSchedule(true);
    const { data, error } = await supabase
      .from("weekly_schedule")
      .insert({
        day_of_week: scheduleForm.day_of_week,
        period: scheduleForm.period,
        title: scheduleForm.title,
        time: scheduleForm.time || null,
        venue: scheduleForm.venue || null,
        notes: scheduleForm.notes || null,
        sort_order: scheduleForm.sort_order,
      })
      .select()
      .single();
    setSavingSchedule(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSchedule((current) => [...current, data as ScheduleRow]);
    setScheduleForm({
      day_of_week: 1,
      period: "morning",
      title: "",
      time: "",
      venue: "",
      notes: "",
      sort_order: 1,
    });
    setMessage("Schedule item added.");
  };

  const handleScheduleDelete = async (id: string) => {
    const { error } = await supabase
      .from("weekly_schedule")
      .delete()
      .eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSchedule((current) => current.filter((item) => item.id !== id));
  };

  const handleDocDownload = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading admin dashboard...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to access the admin dashboard.
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

  if (!isAdmin) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl">Access denied</h1>
        <p className="mt-2 text-sm text-muted">
          You do not have admin access.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...attendanceTrend.map((item) => item.count), 1);
  const mobileTrend = attendanceTrend.slice(-7);

  return (
    <div className="space-y-8">
      <div
        id="admin-overview"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Admin dashboard</h1>
            <p className="text-sm text-muted">
              Manage players, attendance, and session access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  toCsv(
                    players.map((player) => ({
                      full_name: player.full_name,
                      position: player.position,
                      team: player.team,
                      jersey_number: player.jersey_number,
                      height: player.height,
                      weight: player.weight,
                      dominant_hand: player.dominant_hand,
                      wingspan: player.wingspan,
                      colleges_of_interest: player.colleges_of_interest,
                      phone: player.phone,
                      status: player.status,
                      instagram_url: player.instagram_url,
                      tiktok_url: player.tiktok_url,
                    })),
                  ),
                  "players.csv",
                )
              }
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
            >
              Export players
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  toCsv(
                    attendance.map((row) => ({
                      player_id: row.player_id,
                      session_date: row.session_date,
                      joined_at: row.joined_at,
                      left_at: row.left_at,
                      duration_minutes: row.duration_minutes,
                      participant_email: row.participant_email,
                      meeting_id: row.meeting_id,
                      source: row.source,
                    })),
                  ),
                  "attendance.csv",
                )
              }
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
            >
              Export attendance
            </button>
          </div>
        </div>
        {message ? (
          <p className="mt-4 rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]">
            {message}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total players", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Inactive", value: stats.inactive },
            { label: "Suspended", value: stats.suspended },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-line bg-[#fbf8f2] p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        id="admin-attendance-trend"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl">Attendance trend</h2>
            <p className="text-sm text-muted">Last 14 days check-ins.</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="sm:hidden">
            <div className="flex items-end gap-3">
              {mobileTrend.map((day) => (
                <div key={day.key} className="flex-1">
                  <div className="flex h-28 items-end">
                    <div
                      className="w-full rounded-t-2xl bg-foreground/80"
                      style={{
                        height: `${(day.count / maxCount) * 100}%`,
                        minHeight: day.count > 0 ? "10px" : "4px",
                      }}
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] leading-tight text-muted">
                    {day.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-end gap-2">
              {attendanceTrend.map((day) => (
                <div key={day.key} className="flex-1">
                  <div className="flex h-36 items-end">
                    <div
                      className="w-full rounded-t-2xl bg-foreground/80"
                      style={{
                        height: `${(day.count / maxCount) * 100}%`,
                        minHeight: day.count > 0 ? "12px" : "4px",
                      }}
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] text-muted">
                    {day.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        id="admin-session-settings"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div>
          <h2 className="font-display text-2xl">Session settings</h2>
          <p className="text-sm text-muted">
            Used for verified attendance (Zoom webhooks).
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Zoom link (shared)
            <input
              type="url"
              value={sessionSettings.zoom_link}
              onChange={(event) =>
                setSessionSettings((current) => ({
                  ...current,
                  zoom_link: event.target.value,
                }))
              }
              placeholder="https://zoom.us/..."
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Zoom Meeting ID
            <input
              type="text"
              value={sessionSettings.meeting_id}
              onChange={(event) =>
                setSessionSettings((current) => ({
                  ...current,
                  meeting_id: event.target.value,
                }))
              }
              placeholder="9154499341"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Session time
            <input
              type="time"
              value={sessionSettings.session_time}
              onChange={(event) =>
                setSessionSettings((current) => ({
                  ...current,
                  session_time: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Timezone
            <input
              type="text"
              value={sessionSettings.session_tz}
              onChange={(event) =>
                setSessionSettings((current) => ({
                  ...current,
                  session_tz: event.target.value,
                }))
              }
              placeholder="Africa/Lagos"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Minimum minutes
            <input
              type="number"
              min={1}
              value={sessionSettings.min_minutes}
              onChange={(event) =>
                setSessionSettings((current) => ({
                  ...current,
                  min_minutes: Number(event.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleSettingsSave}
          disabled={savingSettings}
          className="mt-6 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingSettings ? "Saving..." : "Save session settings"}
        </button>
      </div>

      <div
        id="admin-attendance-overrides"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Attendance overrides</h2>
            <p className="text-sm text-muted">
              Use this when signal issues affect real attendance.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Player
            <select
              value={overridePlayerId}
              onChange={(event) => setOverridePlayerId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="">Select player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Session date
            <input
              type="date"
              value={overrideDate}
              onChange={(event) => setOverrideDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Status
            <select
              value={overrideStatus}
              onChange={(event) => setOverrideStatus(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Reason (optional)
            <input
              type="text"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Signal issues"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleOverrideSave}
          disabled={savingOverride}
          className="mt-6 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingOverride ? "Saving..." : "Save override"}
        </button>
        {overrides.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-[#fbf8f2] p-4 text-xs text-muted">
            <p className="font-semibold text-foreground">Recent overrides</p>
            <ul className="mt-2 space-y-1">
              {overrides.slice(0, 5).map((item) => {
                const player = players.find((p) => p.id === item.player_id);
                return (
                  <li key={`${item.player_id}-${item.session_date}`}>
                    {item.session_date} · {player?.full_name ?? "Player"} ·{" "}
                    {item.status}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div
        id="admin-players"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Players</h2>
            <p className="text-sm text-muted">
              Update status and review details.
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players..."
            className="w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground sm:w-64"
          />
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full w-full text-left text-sm sm:min-w-[1280px]">
            <thead className="bg-[#f9f6f1] text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Vitals</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Socials</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={10}>
                    No players found.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="border-t border-line">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {player.full_name}
                      </div>
                      <div className="text-xs text-muted">
                        {player.position || "Position not set"} ·{" "}
                        {player.jersey_number || "No jersey"}
                      </div>
                    </td>
                    <td className="px-4 py-4 break-words">{player.email || "-"}</td>
                    <td className="px-4 py-4">{player.team}</td>
                    <td className="px-4 py-4 text-xs text-muted">
                      <div className="font-semibold text-foreground">
                        H {player.height || "-"} · W {player.weight || "-"}
                      </div>
                      <div>
                        Hand {player.dominant_hand || "-"} · WS{" "}
                        {player.wingspan || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">{player.phone || "-"}</td>
                    <td className="px-4 py-4">
                      <select
                        value={player.status || "active"}
                        onChange={(event) =>
                          handleStatusChange(player.id, event.target.value)
                        }
                        className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{player.instagram_url ? "IG" : "-"}</span>
                        <span>{player.tiktok_url ? "TT" : "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>
                          {(playerDocsMap.get(player.id) ?? []).length} files
                        </span>
                        {(playerDocsMap.get(player.id) ?? []).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDocFilter(player.id);
                              const section =
                                document.getElementById("admin-documents");
                              section?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }}
                            className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold transition hover:border-foreground"
                          >
                            View
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>
                          {(playerMediaMap.get(player.id) ?? []).length} videos
                        </span>
                        {(playerMediaMap.get(player.id) ?? []).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMediaFilter(player.id);
                              const section =
                                document.getElementById("admin-media-dump");
                              section?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }}
                            className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold transition hover:border-foreground"
                          >
                            View
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-muted">
                        Updated{" "}
                        {player.updated_at
                          ? new Date(player.updated_at).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        id="admin-education-resources"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Education resources</h2>
            <p className="text-sm text-muted">
              Add film study and YouTube links for players.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Type
            <select
              value={resourceForm.type}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  type: event.target.value as "film" | "youtube",
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="film">Film study</option>
              <option value="youtube">YouTube</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Title
            <input
              type="text"
              value={resourceForm.title}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            URL
            <input
              type="url"
              value={resourceForm.url}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleTitleFetch}
              disabled={fetchingTitle}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-70"
            >
              {fetchingTitle ? "Fetching..." : "Auto-fill title"}
            </button>
          </div>
          <label className="text-sm font-medium md:col-span-2">
            Description (optional)
            <input
              type="text"
              value={resourceForm.description}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleResourceSave}
          disabled={savingResource}
          className="mt-5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingResource ? "Saving..." : "Add resource"}
        </button>
        <div className="mt-6 space-y-3">
          {resources.length === 0 ? (
            <p className="text-sm text-muted">No resources added yet.</p>
          ) : (
            resources.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">
                    {item.type.toUpperCase()} · {item.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResourceDelete(item.id)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-foreground"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        id="admin-weekly-schedule"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Weekly schedule</h2>
            <p className="text-sm text-muted">
              Publish schedule items for the week.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Day of week
            <select
              value={scheduleForm.day_of_week}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  day_of_week: Number(event.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Period
            <select
              value={scheduleForm.period}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  period: event.target.value as "morning" | "afternoon" | "evening",
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Title
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Time
            <input
              type="text"
              value={scheduleForm.time}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              placeholder="04:00 AM"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Venue
            <input
              type="text"
              value={scheduleForm.venue}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  venue: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Notes
            <input
              type="text"
              value={scheduleForm.notes}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Sort order
            <input
              type="number"
              value={scheduleForm.sort_order}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  sort_order: Number(event.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleScheduleSave}
          disabled={savingSchedule}
          className="mt-5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingSchedule ? "Saving..." : "Add schedule item"}
        </button>
        <div className="mt-6 space-y-3">
          {schedule.length === 0 ? (
            <p className="text-sm text-muted">No schedule items yet.</p>
          ) : (
            schedule.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">
                    Day {item.day_of_week} · {item.period} · {item.time || "TBD"} ·{" "}
                    {item.venue || "TBD"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleScheduleDelete(item.id)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-foreground"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        id="admin-media-dump"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div>
          <h2 className="font-display text-2xl">Media dump (player videos)</h2>
          <p className="text-sm text-muted">
            Watch videos uploaded by players.
          </p>
        </div>
        {mediaFilter ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>
              Showing videos for{" "}
              <strong className="text-foreground">
                {playerById.get(mediaFilter)?.full_name ?? "Selected player"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setMediaFilter(null)}
              className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold transition hover:border-foreground"
            >
              Clear filter
            </button>
          </div>
        ) : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {visibleMedia.length === 0 ? (
            <p className="text-sm text-muted">No videos uploaded yet.</p>
          ) : (
            visibleMedia.map((file) => (
              <article
                key={file.path}
                className="overflow-hidden rounded-[26px] border border-line bg-[#fbf8f2]"
              >
                <div className="aspect-video bg-[#d9d2c4]">
                  {file.signedUrl ? (
                    <video
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                      src={file.signedUrl}
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
                      Preview unavailable right now.
                    </div>
                  )}
                </div>
                <div className="space-y-2 px-5 py-4">
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted">
                    Player: {playerById.get(file.userId)?.full_name ?? file.userId}
                  </p>
                  <p className="text-xs text-muted">
                    {file.created_at
                      ? new Date(file.created_at).toLocaleString()
                      : "Recently uploaded"}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div
        id="admin-documents"
        className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8"
      >
        <div>
          <h2 className="font-display text-2xl">Documents (player uploads)</h2>
          <p className="text-sm text-muted">
            Download documents submitted by players.
          </p>
        </div>
        {docFilter ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>
              Showing documents for{" "}
              <strong className="text-foreground">
                {playerById.get(docFilter)?.full_name ?? "Selected player"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setDocFilter(null)}
              className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold transition hover:border-foreground"
            >
              Clear filter
            </button>
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {visibleDocs.length === 0 ? (
            <p className="text-sm text-muted">No documents uploaded yet.</p>
          ) : (
            visibleDocs.map((file) => (
              <div
                key={file.path}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted">
                    Player: {playerById.get(file.userId)?.full_name ?? file.userId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDocDownload(file.path)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-foreground"
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
