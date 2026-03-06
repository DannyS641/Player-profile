"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  zoom_link: string;
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
  zoom_link: "",
  instagram_url: "",
  tiktok_url: "",
  colleges_of_interest: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
        setUserEmail(userData.user.email ?? null);
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
          zoom_link: existingProfile.zoom_link ?? "",
          instagram_url: existingProfile.instagram_url ?? "",
          tiktok_url: existingProfile.tiktok_url ?? "",
          colleges_of_interest: existingProfile.colleges_of_interest ?? "",
        });
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

  const handleChange = (
    field: keyof ProfileForm,
    value: string,
  ): void => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setMessage("Please log in to continue.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: userEmail,
      full_name: profile.full_name,
      position: profile.position,
      team: profile.team,
      jersey_number: profile.jersey_number,
      height: profile.height,
      weight: profile.weight,
      dominant_hand: profile.dominant_hand,
      wingspan: profile.wingspan,
      phone: profile.phone,
      instagram_url: profile.instagram_url,
      tiktok_url: profile.tiktok_url,
      colleges_of_interest: profile.colleges_of_interest,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/profile");
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading your profile...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to complete your player profile.
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
    <div className="mx-auto max-w-3xl rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Set up your profile</h1>
        <p className="text-sm text-muted">
          Share your details so the coaching team can prepare training.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          Full name
          <input
            type="text"
            required
            value={profile.full_name}
            onChange={(event) => handleChange("full_name", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Position
          <input
            type="text"
            value={profile.position}
            onChange={(event) => handleChange("position", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Team
          <input
            type="text"
            value={profile.team}
            onChange={(event) => handleChange("team", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Jersey number
          <input
            type="text"
            value={profile.jersey_number}
            onChange={(event) =>
              handleChange("jersey_number", event.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Height
          <input
            type="text"
            value={profile.height}
            onChange={(event) => handleChange("height", event.target.value)}
            placeholder="e.g. 6'2 or 188cm"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Weight
          <input
            type="text"
            value={profile.weight}
            onChange={(event) => handleChange("weight", event.target.value)}
            placeholder="e.g. 82kg"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Dominant hand
          <input
            type="text"
            value={profile.dominant_hand}
            onChange={(event) =>
              handleChange("dominant_hand", event.target.value)
            }
            placeholder="Right or Left"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Wingspan
          <input
            type="text"
            value={profile.wingspan}
            onChange={(event) => handleChange("wingspan", event.target.value)}
            placeholder="e.g. 6'8 or 203cm"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Phone
          <input
            type="tel"
            value={profile.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          Instagram URL
          <input
            type="url"
            value={profile.instagram_url}
            onChange={(event) =>
              handleChange("instagram_url", event.target.value)
            }
            placeholder="https://instagram.com/username"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium">
          TikTok URL
          <input
            type="url"
            value={profile.tiktok_url}
            onChange={(event) =>
              handleChange("tiktok_url", event.target.value)
            }
            placeholder="https://tiktok.com/@username"
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Colleges of interest
          <textarea
            value={profile.colleges_of_interest}
            onChange={(event) =>
              handleChange("colleges_of_interest", event.target.value)
            }
            placeholder="List the colleges you are interested in"
            className="mt-2 min-h-[120px] w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        {message ? (
          <p className="rounded-2xl border border-line bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18] md:col-span-2">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
