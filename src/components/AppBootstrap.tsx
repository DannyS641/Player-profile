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

    // Cold launch always lands on the login page, never straight into the
    // app — a remembered session only means the login page can offer a
    // Face ID / Touch ID button, not that it can skip itself. Biometric
    // auth only ever fires from an explicit tap there.
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
