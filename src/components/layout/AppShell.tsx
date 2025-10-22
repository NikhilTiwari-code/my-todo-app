"use client";

import { usePathname } from "next/navigation";
import { LiveNotificationToast } from "@/components/live/LiveNotificationToast";
import { useMemo } from "react";

const HIDE_NAV = [/^\/login(\/|$)/, /^\/register(\/|$)/, /^\/auth\//, /^\/onboarding(\/|$)/];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = useMemo(() => !HIDE_NAV.some((rx) => rx.test(pathname || "/")), [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
      {showNav && <LiveNotificationToast />}
      {children}
    </div>
  );
}
