"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monthLabel, shiftMonth } from "@/lib/months";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { TABS } from "./BottomNav";
import { ChevronLeftIcon, ChevronRightIcon, LogoutIcon, MoonIcon, PlusIcon, SunIcon } from "./icons";

const wide = "mx-auto w-full max-w-lg px-4 md:max-w-3xl lg:max-w-5xl";

export default function Header({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openNewExpense } = useApp();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mes = searchParams.get("mes");
  const suffix = mes ? `?mes=${encodeURIComponent(mes)}` : "";

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
      <div className={`${wide} flex items-center justify-between pt-3`}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            W
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">WFin</span>
        </div>
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={`${tab.href}${suffix}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <button
            onClick={openNewExpense}
            className="mr-1 hidden h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 lg:inline-flex"
          >
            <PlusIcon className="h-4 w-4" />
            Novo lançamento
          </button>
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
      <div className={`${wide} py-2`}>
        <div className="mx-auto flex max-w-xs items-center justify-between">
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
      </div>
    </header>
  );
}
