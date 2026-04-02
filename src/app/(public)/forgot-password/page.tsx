"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Message = {
  type: "error" | "success";
  text: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleResetRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Check your email for a password reset link.",
    });
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Reset your password</h1>
        <p className="text-sm text-muted">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>
      <form onSubmit={handleResetRequest} className="mt-8 space-y-5">
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
        {message ? (
          <p
            className={
              message.type === "success"
                ? "rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]"
                : "rounded-2xl border border-line bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18]"
            }
          >
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Sending link..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Remembered your password?{" "}
        <Link className="font-semibold text-foreground" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
