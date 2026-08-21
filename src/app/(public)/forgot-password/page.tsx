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
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 pb-10 pt-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="A5" className="h-24 w-24" />
      <h1 className="mt-6 font-display text-4xl tracking-tight text-foreground">
        Reset your password
      </h1>
      <p className="mt-2 text-base text-muted">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <form
        onSubmit={handleResetRequest}
        className="mt-8 w-full space-y-3 text-left"
      >
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl bg-[#eef3f0] px-5 py-4 text-base text-foreground outline-none transition placeholder:text-muted focus:bg-[#e3ece6]"
        />
        {message ? (
          <p
            className={
              message.type === "success"
                ? "rounded-2xl bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]"
                : "rounded-2xl bg-[#fff4f0] px-4 py-3 text-sm text-[#8f2b18]"
            }
          >
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-foreground px-4 py-4 text-base font-semibold text-background transition hover:bg-[#08150e] disabled:cursor-not-allowed disabled:opacity-70"
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
