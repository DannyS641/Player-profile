"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User,
  ClipboardCheck,
  CalendarDays,
  FileText,
  MoreHorizontal,
  GraduationCap,
  Images,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const primaryTabs = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: FileText },
];

const moreLinks = [
  { href: "/education", label: "Education", icon: GraduationCap },
  { href: "/media-dump", label: "Media Dump", icon: Images },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (isMounted) {
        setIsAdmin(profile?.role === "admin");
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const isMoreSectionActive = [...moreLinks.map((l) => l.href), "/admin"].includes(
    pathname,
  );

  return (
    <>
      {moreOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      {moreOpen ? (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 rounded-[24px] border border-line bg-white p-3 shadow-[0_20px_50px_-25px_rgba(11,27,43,0.5)] md:hidden">
          <div className="grid gap-1">
            {moreLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[#eef3f0]"
                >
                  <Icon className="h-5 w-5 text-muted" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[#eef3f0]"
              >
                <ShieldCheck className="h-5 w-5 text-muted" />
                Admin
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                  active ? "text-accent-2" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    active ? "bg-accent-2/12" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            className={`flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
              moreOpen || isMoreSectionActive ? "text-accent-2" : "text-muted"
            }`}
            aria-expanded={moreOpen}
            aria-label="More"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                moreOpen || isMoreSectionActive ? "bg-accent-2/12" : ""
              }`}
            >
              <MoreHorizontal
                className="h-5 w-5"
                strokeWidth={moreOpen || isMoreSectionActive ? 2.4 : 2}
              />
            </span>
            More
          </button>
        </div>
      </nav>
    </>
  );
}
