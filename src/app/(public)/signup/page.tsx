"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Check your email to confirm your account, then log in to continue.",
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/onboarding");
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 pb-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="A5" className="h-24 w-24" />
      <h1 className="mt-6 font-display text-4xl tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-2 text-base text-muted">
        Start your player profile and get ready for training.
      </p>
      <form onSubmit={handleSignup} className="mt-8 w-full space-y-3 text-left">
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl bg-[var(--surface-soft)] px-5 py-4 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[var(--surface-soft-focus)]"
        />
        <PasswordInput
          name="new-password"
          autoComplete="new-password"
          required
          placeholder="Password"
          value={password}
          onChange={setPassword}
          className="w-full rounded-2xl bg-[var(--surface-soft)] px-5 py-4 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[var(--surface-soft-focus)]"
        />
        {message ? (
          <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-foreground px-4 py-4 text-base font-semibold text-background transition hover:bg-[var(--ink-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted">
        By creating an account, you agree to the{" "}
        <Link className="font-semibold text-foreground" href="/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link className="font-semibold text-foreground" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-foreground" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
