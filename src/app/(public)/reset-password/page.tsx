"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

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
    <div className="mx-auto max-w-xl rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Choose a new password</h1>
        <p className="text-sm text-muted">
          Use the reset link from your email to set a new password.
        </p>
      </div>
      <form onSubmit={handlePasswordReset} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">
          New password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-transparent px-4 py-3 text-sm outline-none transition focus:border-foreground"
          />
        </label>
        {message ? (
          <p
            className={
              message.type === "success"
                ? "rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]"
                : message.type === "info"
                  ? "rounded-2xl border border-line bg-[#fbf8f2] px-4 py-3 text-sm text-[#7a5b1f]"
                  : "rounded-2xl border border-line bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18]"
            }
          >
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || checking}
          className="w-full rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
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
