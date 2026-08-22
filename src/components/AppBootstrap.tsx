"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { supabase } from "@/lib/supabase/client";

const MIN_SPLASH_MS = 2000;
const launchTime = Date.now();

export default function AppBootstrap() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (pathname === "/") {
      supabase.auth.getSession().then(async ({ data }) => {
        const userId = data.session?.user.id;
        if (!userId) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();

        router.replace(profile ? "/profile" : "/onboarding");
      });
      return;
    }

    const remaining = Math.max(MIN_SPLASH_MS - (Date.now() - launchTime), 0);
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, remaining);

    return () => clearTimeout(timer);
  }, [pathname, router]);

  return null;
}
