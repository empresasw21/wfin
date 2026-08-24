"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { currentMonthKey } from "@/lib/months";
import DashboardScreen from "@/components/DashboardScreen";
import BottomNav from "@/components/BottomNav";
import LoadingScreen from "@/components/LoadingScreen";
import SetupNotice from "@/components/SetupNotice";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useRequireAuth();

  if (status === "setup") return <SetupNotice />;
  if (status === "loading") return <LoadingScreen />;

  function validMonthKey(raw: string | null): string {
    if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return currentMonthKey();
    return raw;
  }

  const monthKey = validMonthKey(searchParams.get("mes"));

  function setMonth(next: string) {
    router.replace(`/dashboard?mes=${next}`, { scroll: false });
  }

  return (
    <>
      <DashboardScreen monthKey={monthKey} onMonthChange={setMonth} />
      <BottomNav />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}
