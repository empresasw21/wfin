"use client";

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
  invertDelta = false,
}: {
  label: string;
  value: number;
  current: number;
  previous: number | null;
  accent: string;
  invertDelta?: boolean;
}) {
  return (
    <div className="min-w-[46%] snap-start rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden />
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p
        className={`mt-2 text-xl font-bold tracking-tight tabular-nums ${
          label === "Saldo do mês" && current < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {fmtBRL(value)}
      </p>
      <div className="mt-2">
        <DeltaBadge current={current} previous={previous} size="xs" invert={invertDelta} />
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
  const prevStats = statsForMonth(expenses, shiftMonth(monthKey, -1));

  const prevOrNull = (prev: number, curr: number) =>
    prev === 0 && curr > 0 ? null : prev;

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0 md:[grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]"
    >
      <Card
        label="Saldo do mês"
        value={cur.balance}
        current={cur.balance}
        previous={prevOrNull(prevStats.balance, cur.balance)}
        accent="bg-violet-500"
        invertDelta
      />
      <Card
        label={`Receitas (${cur.incomeCount})`}
        value={cur.incomeTotal}
        current={cur.incomeTotal}
        previous={prevOrNull(prevStats.incomeTotal, cur.incomeTotal)}
        accent="bg-teal-500"
        invertDelta
      />
      <Card
        label="Despesas totais"
        value={cur.total}
        current={cur.total}
        previous={prevOrNull(prevStats.total, cur.total)}
        accent="bg-emerald-500"
      />
      <Card
        label={`Fixas (${cur.fixedCount})`}
        value={cur.fixedTotal}
        current={cur.fixedTotal}
        previous={prevOrNull(prevStats.fixedTotal, cur.fixedTotal)}
        accent="bg-sky-500"
      />
      <Card
        label={`Parcelas (${cur.activeInstallments})`}
        value={cur.installmentTotal}
        current={cur.installmentTotal}
        previous={prevOrNull(prevStats.installmentTotal, cur.installmentTotal)}
        accent="bg-amber-500"
      />
      {cur.onceCount > 0 && (
        <Card
          label={`Únicas (${cur.onceCount})`}
          value={cur.onceTotal}
          current={cur.onceTotal}
          previous={prevOrNull(prevStats.onceTotal, cur.onceTotal)}
          accent="bg-orange-500"
        />
      )}
      <div className="min-w-[30%] shrink-0 md:hidden" aria-hidden />
    </div>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {right}
    </div>
  );
}
