"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { monthLabel, shiftMonth } from "@/lib/months";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { ChevronLeftIcon, ChevronRightIcon, LogoutIcon, MoonIcon, SunIcon } from "./icons";

export default function Header({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("wfin-theme", next ? "dark" : "light");
    } catch {}
  }

  async function handleSignOut() {
    if (supabaseConfigured) await getSupabase().auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            W
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">WFin</span>
        </div>
        <div className="flex items-center gap-1">
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={handleSignOut}
            aria-label="Sair da conta"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        <button
          onClick={() => onMonthChange(shiftMonth(monthKey, -1))}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">{monthLabel(monthKey)}</p>
        <button
          onClick={() => onMonthChange(shiftMonth(monthKey, 1))}
          aria-label="Próximo mês"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
