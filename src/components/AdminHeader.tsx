"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  { href: "#admin-overview", label: "Overview" },
  { href: "#admin-attendance-trend", label: "Attendance" },
  { href: "#admin-session-settings", label: "Session" },
  { href: "#admin-attendance-overrides", label: "Overrides" },
  { href: "#admin-players", label: "Players" },
  { href: "#admin-education-resources", label: "Education" },
  { href: "#admin-weekly-schedule", label: "Schedule" },
  { href: "#admin-media-dump", label: "Media Dump" },
  { href: "#admin-documents", label: "Documents" },
];

export default function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="mx-auto w-full max-w-7xl rounded-[28px] border border-line/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(246,241,232,0.98)_100%)] px-5 py-5 shadow-[0_24px_60px_-42px_rgba(11,27,43,0.38)] backdrop-blur sm:px-6 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Admin Console
          </div>
          <Link
            href="/admin"
            className="block font-display text-2xl tracking-tight text-foreground sm:text-[2rem]"
          >
            ADRENALE 5 Admin
          </Link>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Manage players, attendance, uploads, and training operations from one
            dedicated workspace.
          </p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/profile"
            className="inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-foreground"
          >
            Player App
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
          >
            Sign out
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-foreground md:hidden"
          aria-label="Toggle admin navigation"
          aria-expanded={menuOpen}
        >
          Menu
        </button>
      </div>

      <div className="mt-6 rounded-[24px] border border-line bg-white/78 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <nav className="hidden items-center gap-2 overflow-x-auto no-scrollbar md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-[#f6f1e8] hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <p className="px-2 text-sm font-semibold text-foreground">
            Dashboard sections
          </p>
          <span className="rounded-full bg-[#f6f1e8] px-3 py-1 text-xs font-semibold text-muted">
            {navItems.length} links
          </span>
        </div>
      </div>

      {menuOpen ? (
        <div className="mt-4 space-y-4 rounded-[24px] border border-line bg-white p-4 shadow-[0_20px_45px_-35px_rgba(11,27,43,0.45)] md:hidden">
          <div className="grid gap-2 sm:grid-cols-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-line px-4 py-3 text-sm font-semibold transition hover:border-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl border border-line px-4 py-3 text-center text-sm font-semibold transition hover:border-foreground"
            >
              Player App
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
