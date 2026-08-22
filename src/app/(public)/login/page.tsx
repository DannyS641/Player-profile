"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Fingerprint, Mail, X } from "lucide-react";
import { supabase, setRememberMe } from "@/lib/supabase/client";
import {
  getBiometryAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometricAuth";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;
    const checkBiometricLogin = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !isMounted) return;

      const { isAvailable, label } = await getBiometryAvailability();
      if (isAvailable && isMounted) {
        setBiometricLabel(label);
      }
    };

    checkBiometricLogin();
    return () => {
      isMounted = false;
    };
  }, []);

  const goToProfileOrOnboarding = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profile) {
      router.replace("/profile");
    } else {
      router.replace("/onboarding");
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setMessage(null);

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      setBiometricLoading(false);
      setBiometricLabel(null);
      return;
    }

    const verified = await authenticateWithBiometrics();
    if (!verified) {
      setBiometricLoading(false);
      setMessage("Couldn't verify — please log in with your password.");
      return;
    }

    await goToProfileOrOnboarding(userId);
  };

  const handleContinueWithEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setMessage(null);
    setStep("password");
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setRememberMe(remember);

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

    await goToProfileOrOnboarding(userId);
    setLoading(false);
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 pb-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="A5" className="h-24 w-24" />

      {step === "email" ? (
        <>
          <h1 className="mt-6 font-display text-4xl tracking-tight text-foreground">
            Log in
          </h1>
          <p className="mt-2 text-base text-muted">
            Enter your email to continue.
          </p>
          <form
            onSubmit={handleContinueWithEmail}
            className="mt-8 w-full space-y-3 text-left"
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl bg-[var(--surface-soft)] py-4 pl-12 pr-12 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[var(--surface-soft-focus)]"
              />
              {email ? (
                <button
                  type="button"
                  onClick={() => setEmail("")}
                  aria-label="Clear email"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {biometricLabel ? (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line px-4 py-4 text-base font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Fingerprint className="h-5 w-5" />
                {biometricLoading
                  ? "Verifying..."
                  : `Log in with ${biometricLabel}`}
              </button>
            ) : null}
            {message ? (
              <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-2xl bg-foreground px-4 py-4 text-base font-semibold text-background transition hover:bg-[var(--ink-hover)]"
            >
              Continue
            </button>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setMessage(null);
            }}
            className="mt-6 flex items-center gap-1 self-start text-sm font-semibold text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {email}
          </button>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
            Enter password
          </h1>
          <p className="mt-2 text-base text-muted">
            Update your profile and check in for training.
          </p>
          <form
            onSubmit={handleLogin}
            className="mt-8 w-full space-y-3 text-left"
          >
            <PasswordInput
              name="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={setPassword}
              className="w-full rounded-2xl bg-[var(--surface-soft)] px-5 py-4 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[var(--surface-soft-focus)]"
            />
            <label className="flex items-center gap-2 px-1 text-sm text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-accent"
              />
              Remember me
            </label>
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
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>
        </>
      )}

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
