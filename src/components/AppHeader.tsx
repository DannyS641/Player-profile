"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AppHeader() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (isMounted) {
          setIsAdmin(profile?.role === "admin");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <Link href="/profile" className="flex items-center whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="A5" className="h-16 w-16" />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-[#f4f8f6]"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <Link href="/profile" className="flex items-center whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="A5" className="h-16 w-16" />
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
            href="/media-dump"
            className="px-2 py-1 transition hover:text-foreground"
          >
            Media Dump
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
      </div>
    </header>
  );
}
