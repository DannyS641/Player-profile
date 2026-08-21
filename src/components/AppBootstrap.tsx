"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

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
      router.replace("/login");
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
