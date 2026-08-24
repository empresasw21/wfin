"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ChartIcon, HomeIcon, PlusIcon } from "./icons";

const TABS = [
  { href: "/", label: "Início", Icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/dashboard",
    label: "Dashboard",
    Icon: ChartIcon,
    match: (p: string) => p.startsWith("/dashboard"),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openNewExpense } = useApp();

  const mes = searchParams.get("mes");
  const suffix = mes ? `?mes=${encodeURIComponent(mes)}` : "";

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      <div className="relative mx-auto grid h-16 max-w-lg grid-cols-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${suffix}`}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              <tab.Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
        <button
          onClick={openNewExpense}
          aria-label="Adicionar lançamento"
          className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-white transition-transform hover:scale-105 active:scale-95 dark:ring-zinc-950"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      </div>
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
