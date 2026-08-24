"use client";

import { fmtBRL } from "@/lib/format";
import { monthlyTotals } from "@/lib/calc";
import { monthShort, shiftMonth } from "@/lib/months";
import type { Expense } from "@/lib/types";

export default function MonthChart({
  expenses,
  monthKey,
  onSelect,
}: {
  expenses: Expense[];
  monthKey: string;
  onSelect: (key: string) => void;
}) {
  const keys = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey, -5 + i));
  const totals = monthlyTotals(expenses, keys);
  const max = Math.max(...totals, 1);

  return (
    <section aria-label="Evolução dos últimos 6 meses">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Gastos · últimos 6 meses
      </h2>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-32 items-end justify-between gap-2">
          {keys.map((key, i) => {
            const value = totals[i];
            const height = Math.max(4, (value / max) * 100);
            const selected = key === monthKey;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                title={`${monthShort(key)} · ${fmtBRL(value)}`}
                aria-label={`${monthShort(key)}: ${fmtBRL(value)}`}
                className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5"
              >
                {selected && (
                  <span className="text-[9px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {fmtBRL(value)}
                  </span>
                )}
                <span
                  className={`w-full max-w-[34px] rounded-t-md transition-colors ${
                    selected
                      ? "bg-emerald-500"
                      : "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-zinc-600"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span
                  className={`text-[10px] font-medium ${
                    selected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {monthShort(key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
