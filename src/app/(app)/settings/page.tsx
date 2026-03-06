"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type ProfileInfo = {
  full_name: string;
  position: string;
  team: string;
  jersey_number: string;
  height: string;
  weight: string;
  dominant_hand: string;
  wingspan: string;
  phone: string;
  colleges_of_interest: string;
  photo_url: string;
  instagram_url: string;
  tiktok_url: string;
};

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileInfo>({
    full_name: "",
    position: "",
    team: "Adrenale 5",
    jersey_number: "",
    height: "",
    weight: "",
    dominant_hand: "",
    wingspan: "",
    phone: "",
    colleges_of_interest: "",
    photo_url: "",
    instagram_url: "",
    tiktok_url: "",
  });

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

      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, position, team, jersey_number, height, weight, dominant_hand, wingspan, phone, colleges_of_interest, photo_url, instagram_url, tiktok_url",
        )
        .eq("id", userData.user.id)
        .single();

      if (isMounted && data) {
        setProfile({
          full_name: data.full_name ?? "",
          position: data.position ?? "",
          team: data.team ?? "Adrenale 5",
          jersey_number: data.jersey_number ?? "",
          height: data.height ?? "",
          weight: data.weight ?? "",
          dominant_hand: data.dominant_hand ?? "",
          wingspan: data.wingspan ?? "",
          phone: data.phone ?? "",
          colleges_of_interest: data.colleges_of_interest ?? "",
          photo_url: data.photo_url ?? "",
          instagram_url: data.instagram_url ?? "",
          tiktok_url: data.tiktok_url ?? "",
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

  const handlePasswordUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);

    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      setPasswordMessage(error.message);
      return;
    }

    setPasswordMessage("Password updated.");
    setPassword("");
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!userId) {
      setPhotoMessage("Please log in to upload a photo.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoMessage(null);
    setSavingPhoto(true);

    const fileExt = file.name.split(".").pop() ?? "jpg";
    const filePath = `${userId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setPhotoMessage(uploadError.message);
      setSavingPhoto(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_url: publicData.publicUrl })
      .eq("id", userId);

    if (updateError) {
      setPhotoMessage(updateError.message);
      setSavingPhoto(false);
      return;
    }

    setProfile((current) => ({
      ...current,
      photo_url: publicData.publicUrl,
    }));
    setPhotoMessage("Profile photo updated.");
    setSavingPhoto(false);
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  const handleSocialSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!userId) {
      setSocialMessage("Please log in to update socials.");
      return;
    }

    setSavingSocials(true);
    setSocialMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        instagram_url: profile.instagram_url,
        tiktok_url: profile.tiktok_url,
      })
      .eq("id", userId);

    setSavingSocials(false);

    if (error) {
      setSocialMessage(error.message);
      return;
    }

    setSocialMessage("Social links updated.");
  };

  const handleProfileSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!userId) {
      setProfileMessage("Please log in to update your profile.");
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
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
        colleges_of_interest: profile.colleges_of_interest,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingProfile(false);

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setProfileMessage("Profile updated.");
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading settings...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to manage settings.
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
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Settings</h1>
            <p className="text-sm text-muted">Manage your account.</p>
          </div>
          <Link
            href="/profile"
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-foreground"
          >
            Back to profile
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h2 className="font-display text-xl">Profile details</h2>
        <p className="mt-2 text-sm text-muted">
          Update the details shown on your profile.
        </p>
        <form onSubmit={handleProfileSave} className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">
            Full name
            <input
              type="text"
              required
              value={profile.full_name}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Position
            <input
              type="text"
              value={profile.position}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  position: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Team
            <input
              type="text"
              value={profile.team}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  team: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Jersey number
            <input
              type="text"
              value={profile.jersey_number}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  jersey_number: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Height
            <input
              type="text"
              value={profile.height}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  height: event.target.value,
                }))
              }
              placeholder="e.g. 6'2 or 188cm"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Weight
            <input
              type="text"
              value={profile.weight}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  weight: event.target.value,
                }))
              }
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
                setProfile((current) => ({
                  ...current,
                  dominant_hand: event.target.value,
                }))
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
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  wingspan: event.target.value,
                }))
              }
              placeholder="e.g. 6'8 or 203cm"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium">
            Phone
            <input
              type="tel"
              value={profile.phone}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Colleges of interest
            <textarea
              value={profile.colleges_of_interest}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  colleges_of_interest: event.target.value,
                }))
              }
              placeholder="List the colleges you are interested in"
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          {profileMessage ? (
            <p className="rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924] md:col-span-2">
              {profileMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>

      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h2 className="font-display text-xl">Profile photo</h2>
        <p className="mt-2 text-sm text-muted">
          Upload a clear headshot. PNG or JPG.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-[#fbf8f2] p-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#e9e1d6] text-lg font-semibold text-muted">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(profile.full_name)
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold transition hover:border-foreground">
            Upload photo
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>
        {photoMessage ? (
          <p className="mt-4 rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]">
            {photoMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h2 className="font-display text-xl">Social links</h2>
        <p className="mt-2 text-sm text-muted">
          Add your Instagram and TikTok URLs for your profile card.
        </p>
        <form onSubmit={handleSocialSave} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Instagram URL
            <input
              type="url"
              value={profile.instagram_url}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  instagram_url: event.target.value,
                }))
              }
              placeholder="https://instagram.com/username"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block text-sm font-medium">
            TikTok URL
            <input
              type="url"
              value={profile.tiktok_url}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  tiktok_url: event.target.value,
                }))
              }
              placeholder="https://tiktok.com/@username"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          {socialMessage ? (
            <p className="rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]">
              {socialMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={savingSocials}
            className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingSocials ? "Saving..." : "Save social links"}
          </button>
        </form>
      </div>

      <div className="rounded-[28px] border border-line bg-white p-8 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)]">
        <h2 className="font-display text-xl">Password</h2>
        <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            New password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          {passwordMessage ? (
            <p className="rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]">
              {passwordMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
