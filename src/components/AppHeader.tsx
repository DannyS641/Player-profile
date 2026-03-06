"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AppHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setEmail(data.user?.email ?? null);
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();
        if (isMounted) {
          setIsAdmin(profile?.role === "admin");
          setName(profile?.full_name ?? null);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="mx-auto w-full max-w-6xl rounded-[28px] border border-line bg-[#f6f1e8] px-5 py-4 shadow-[0_10px_24px_-22px_rgba(11,27,43,0.45)] sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <Link
          href="/profile"
          className="font-display text-lg tracking-tight text-foreground whitespace-nowrap"
        >
          ADRENALE 5
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-full border border-line px-3 py-2 text-xs font-semibold transition hover:border-foreground"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-4 w-4 flex-col items-center justify-center gap-1">
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
          </span>
        </button>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <Link
          href="/profile"
          className="font-display text-lg tracking-tight text-foreground whitespace-nowrap"
        >
          ADRENALE 5
        </Link>
        <nav className="flex flex-1 items-center justify-evenly text-xs font-semibold text-foreground/80">
          <Link
            href="/profile"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Profile
          </Link>
          <Link
            href="/attendance"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Attendance
          </Link>
          <Link
            href="/settings"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Settings
          </Link>
          <Link
            href="/education"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Education
          </Link>
          <Link
            href="/documents"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Documents
          </Link>
          <Link
            href="/schedule"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Schedule
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="px-2 py-1 transition hover:text-foreground"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition hover:bg-[#1e3347]"
          >
            Sign out
          </button>
          <div className="hidden max-w-[220px] break-words text-[11px] text-muted lg:block">
            {name
              ? `Signed in as ${name}`
              : email
                ? `Signed in as ${email}`
                : "Not signed in"}
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="relative md:hidden">
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-[0_20px_40px_-35px_rgba(11,27,43,0.7)]">
            <Link
              href="/profile"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/attendance"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Attendance
            </Link>
            <Link
              href="/settings"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <Link
              href="/education"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Education
            </Link>
            <Link
              href="/documents"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Documents
            </Link>
            <Link
              href="/schedule"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Schedule
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-foreground"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
            >
              Sign out
            </button>
            <div className="max-w-full break-words text-xs text-muted">
              {name
                ? `Signed in as ${name}`
                : email
                  ? `Signed in as ${email}`
                  : "Not signed in"}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
