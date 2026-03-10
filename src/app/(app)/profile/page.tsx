"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

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

const emptyProfile: ProfileForm = {
  full_name: "",
  position: "",
  team: "Adrenale 5",
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
          team: existingProfile.team ?? "Adrenale 5",
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

      if (isMounted) {
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckIn = async () => {
    if (!userId) {
      setMessage("Please log in to check in.");
      return;
    }

    if (!zoomLink) {
      setMessage("Zoom link not set by admin yet.");
      return;
    }

    setMessage(
      `Opening Zoom. Attendance will be verified after ${minMinutes} minutes.`,
    );
    window.open(zoomLink, "_blank", "noopener,noreferrer");
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  const normalizeUrl = (value: string) => {
    if (!value) return "";
    return value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading your profile...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to view your profile.
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
    <div className="grid gap-6 md:gap-8 lg:grid-cols-[0.55fr_1fr]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-line bg-white shadow-[0_30px_80px_-60px_rgba(11,27,43,0.6)]">
          <div className="relative h-40 bg-[radial-gradient(circle_at_top,_#ffd2b2_0%,_#f05d23_55%,_#c24719_100%)]">
            <svg
              className="absolute bottom-0 w-full text-white"
              viewBox="0 0 400 60"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M0 40 C60 10 120 70 180 40 C240 10 300 70 400 35 L400 60 L0 60 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="-mt-12 flex flex-col items-center px-6 pb-8 text-center">
            <div className="relative z-10 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e9e1d6] shadow-lg">
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
            <h2 className="mt-4 font-display text-xl">
              {profile.full_name || "Player name"}
            </h2>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {profile.position || "Position"} · {profile.team}
            </p>
            <div className="mt-4 grid w-full grid-cols-2 gap-3 text-left text-xs text-muted">
              <div className="rounded-2xl border border-line bg-[#fbf8f2] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em]">Height</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {profile.height || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-[#fbf8f2] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em]">Weight</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {profile.weight || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-[#fbf8f2] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em]">
                  Dominant hand
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {profile.dominant_hand || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-[#fbf8f2] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em]">
                  Wingspan
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {profile.wingspan || "-"}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full rounded-2xl border border-line bg-[#fbf8f2] px-3 py-2 text-left text-xs text-muted">
              <p className="text-[10px] uppercase tracking-[0.2em]">Phone</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {profile.phone || "-"}
              </p>
            </div>
            <p className="mt-4 text-xs text-muted">
              COLLEGE OF INTEREST:{" "}
              <span className="font-semibold text-foreground">
                {profile.colleges_of_interest || "Not set"}
              </span>
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                {
                  label: "Instagram",
                  url: normalizeUrl(profile.instagram_url),
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
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
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        d="M16.5 3c.6 2 2.2 3.6 4.2 4.2v3.3c-1.5-.1-3-.6-4.2-1.4v6.2a5.9 5.9 0 1 1-5.9-5.9c.5 0 1 .1 1.5.2v3.2a2.7 2.7 0 1 0 2.1 2.6V3h2.3Z"
                      />
                    </svg>
                  ),
                },
              ]
                .filter((item) => item.url)
                .map((item) => (
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
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
        >
          Edit profile in settings
        </Link>
      </div>
      <aside className="space-y-5">
        <div className="rounded-[28px] border border-line bg-foreground p-6 text-background sm:p-7">
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
            className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d84f1d]"
          >
            Join Zoom and mark present
          </button>
          <p className="mt-3 text-xs text-background/60">
            Attendance is tracked by day.
          </p>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-6 sm:p-7">
          <h3 className="font-display text-lg">Need to update details?</h3>
          <p className="mt-2 text-sm text-muted">
            Save your profile anytime and the changes sync instantly.
          </p>
          <Link
            href="/attendance"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
          >
            View attendance history
          </Link>
        </div>
      </aside>
    </div>
  );
}
