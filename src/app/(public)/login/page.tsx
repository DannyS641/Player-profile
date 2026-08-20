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
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 pb-10 pt-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent font-display text-lg font-semibold text-white">
        A5
      </div>
      <h1 className="mt-6 font-display text-3xl tracking-tight text-foreground">
        Log in
      </h1>
      <p className="mt-2 text-sm text-muted">
        Update your profile and check in for training.
      </p>
      <form onSubmit={handleLogin} className="mt-8 w-full space-y-3 text-left">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl bg-[#efe8da] px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:bg-[#e6ddc9]"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl bg-[#efe8da] px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:bg-[#e6ddc9]"
        />
        {message ? (
          <p className="rounded-2xl bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18]">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-foreground px-4 py-4 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link className="font-semibold text-foreground" href="/signup">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Can&apos;t remember password?{" "}
        <Link className="font-semibold text-foreground" href="/forgot-password">
          Reset password here
        </Link>
        .
      </p>
    </div>
  );
}
