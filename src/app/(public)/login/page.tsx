"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setMessage("Login succeeded but no user was returned.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    setLoading(false);
    if (profile) {
      router.replace("/profile");
    } else {
      router.replace("/onboarding");
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="text-sm text-muted">
          Log in to update your profile and check in for training.
        </p>
      </div>
      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-transparent px-4 py-3 text-sm outline-none transition focus:border-foreground"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-transparent px-4 py-3 text-sm outline-none transition focus:border-foreground"
          />
        </label>
        {message ? (
          <p className="rounded-2xl border border-line bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18]">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link className="font-semibold text-foreground" href="/signup">
          Create an account
        </Link>
      </p>
    </div>
  );
}
