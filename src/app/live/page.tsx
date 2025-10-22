"use client";

import DashboardLayout from "@/app/(dashboard)/layout";
import { LiveLobby } from "@/components/live/LiveLobby";

export default function LivePage() {
  return (
    <DashboardLayout>
      <LiveLobby />
    </DashboardLayout>
  );
}
