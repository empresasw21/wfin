"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabaseConfigured } from "@/lib/supabase";
import { currentMonthKey } from "@/lib/months";
import Dashboard from "@/components/Dashboard";
import SetupNotice from "@/components/SetupNotice";

export default function HomePage() {
  const router = useRouter();
  const { user, authLoading } = useApp();
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    if (!authLoading && !user && supabaseConfigured) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (!supabaseConfigured) return <SetupNotice />;

  if (authLoading || !user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-zinc-950" aria-busy>
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
          W
        </span>
      </main>
    );
  }

  return <Dashboard monthKey={monthKey} onMonthChange={setMonthKey} />;
}
