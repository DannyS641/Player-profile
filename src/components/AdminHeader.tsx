"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [activeSection, setActiveSection] = useState(navItems[0].href);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSection(`#${visibleEntries[0].target.id}`);
        }
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.2, 0.35, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="mx-auto w-full max-w-7xl rounded-[22px] border border-line/80 bg-white/94 px-5 py-5 shadow-[0_18px_40px_-34px_rgba(11,27,43,0.22)] backdrop-blur sm:px-6 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-[#f8f4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="h-2 w-2 rounded-full bg-[#2f855a]" />
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

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/profile"
            className="inline-flex items-center rounded-full border border-line bg-[#fcfaf6] px-4 py-2 text-sm font-semibold text-foreground transition hover:border-foreground"
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
          className="inline-flex items-center justify-center rounded-full border border-line bg-[#fcfaf6] px-4 py-2 text-sm font-semibold transition hover:border-foreground lg:hidden"
          aria-label="Toggle admin actions"
          aria-expanded={menuOpen}
        >
          More
        </button>
      </div>

      <div className="mt-6 rounded-[18px] border border-line bg-[#fcfaf6] p-2">
        <nav className="hidden items-center gap-1 overflow-x-auto no-scrollbar lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeSection === item.href
                  ? "bg-white text-foreground shadow-[0_8px_20px_-18px_rgba(11,27,43,0.45)]"
                  : "text-muted hover:bg-white hover:text-foreground"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <label htmlFor="admin-section-nav" className="sr-only">
            Jump to admin section
          </label>
          <select
            id="admin-section-nav"
            value={activeSection}
            onChange={(event) => {
              const nextHref = event.target.value;
              setActiveSection(nextHref);
              setMenuOpen(false);
              window.location.hash = nextHref;
            }}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-foreground"
          >
            {navItems.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-foreground"
            aria-label="Toggle admin actions"
            aria-expanded={menuOpen}
          >
            More
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="mt-4 grid gap-2 rounded-[18px] border border-line bg-white p-3 shadow-[0_18px_40px_-34px_rgba(11,27,43,0.24)] lg:hidden sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-[#fcfaf6] px-4 py-3 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Current section
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {navItems.find((item) => item.href === activeSection)?.label ?? "Overview"}
            </p>
          </div>
          <div className="hidden sm:block" />
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
      ) : null}

      <div className="mt-4 hidden items-center justify-between gap-3 border-t border-line/80 pt-4 lg:flex">
        <p className="text-sm text-muted">
          {navItems.find((item) => item.href === activeSection)?.label ?? "Overview"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-[#2f855a]" />
          Live admin workspace
        </div>
      </div>
    </header>
  );
}
