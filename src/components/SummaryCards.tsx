"use client";

import type { ReactNode } from "react";
import { fmtBRL } from "@/lib/format";
import { statsForMonth } from "@/lib/calc";
import { shiftMonth } from "@/lib/months";
import type { Expense } from "@/lib/types";
import DeltaBadge from "./DeltaBadge";

function Card({
  label,
  value,
  current,
  previous,
  accent,
}: {
  label: string;
  value: number;
  current: number;
  previous: number | null;
  accent: string;
}) {
  return (
    <div className="min-w-[46%] snap-start rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden />
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
        {fmtBRL(value)}
      </p>
      <div className="mt-2">
        <DeltaBadge current={current} previous={previous} size="xs" />
      </div>
    </div>
  );
}

export default function SummaryCards({
  expenses,
  monthKey,
}: {
  expenses: Expense[];
  monthKey: string;
}) {
  const cur = statsForMonth(expenses, monthKey);
  const prev = statsForMonth(expenses, shiftMonth(monthKey, -1));

  return (
    <section aria-label="Resumo do mês">
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card
          label="Total do mês"
          value={cur.total}
          current={cur.total}
          previous={prev.total === 0 && cur.total > 0 ? null : prev.total}
          accent="bg-emerald-500"
        />
        <Card
          label="Despesas fixas"
          value={cur.fixedTotal}
          current={cur.fixedTotal}
          previous={prev.fixedTotal === 0 && cur.fixedTotal > 0 ? null : prev.fixedTotal}
          accent="bg-sky-500"
        />
        <Card
          label={`Parcelas (${cur.activeInstallments})`}
          value={cur.installmentTotal}
          current={cur.installmentTotal}
          previous={prev.installmentTotal === 0 && cur.installmentTotal > 0 ? null : prev.installmentTotal}
          accent="bg-amber-500"
        />
        <div className="min-w-[30%] shrink-0" aria-hidden />
      </div>
    </section>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {right}
    </div>
  );
}
