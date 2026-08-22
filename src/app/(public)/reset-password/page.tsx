"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

type Message = {
  type: "error" | "success" | "info";
  text: string;
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setCanReset(Boolean(data.session));
      setChecking(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setCanReset(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!canReset) {
      setMessage({
        type: "info",
        text: "Open the reset link from your email to continue.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPassword("");
    setMessage({
      type: "success",
      text: "Password updated. You can now log in.",
    });
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 pb-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="A5" className="h-24 w-24" />
      <h1 className="mt-6 font-display text-4xl tracking-tight text-foreground">
        Choose a new password
      </h1>
      <p className="mt-2 text-base text-muted">
        Use the reset link from your email to set a new password.
      </p>
      <form
        onSubmit={handlePasswordReset}
        className="mt-8 w-full space-y-3 text-left"
      >
        <PasswordInput
          name="new-password"
          autoComplete="new-password"
          required
          placeholder="New password"
          value={password}
          onChange={setPassword}
          className="w-full rounded-2xl bg-[var(--surface-soft)] px-5 py-4 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[var(--surface-soft-focus)]"
        />
        {message ? (
          <p
            className={
              message.type === "success"
                ? "rounded-2xl bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]"
                : message.type === "info"
                  ? "rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--info)]"
                  : "rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
            }
          >
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || checking}
          className="w-full rounded-2xl bg-foreground px-4 py-4 text-base font-semibold text-background transition hover:bg-[var(--ink-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Need a new link?{" "}
        <Link className="font-semibold text-foreground" href="/forgot-password">
          Request another reset
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Or{" "}
        <Link className="font-semibold text-foreground" href="/login">
          go back to login
        </Link>
        .
      </p>
    </div>
  );
}
