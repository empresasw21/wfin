"use client";

import { useCallback } from "react";
import { fmtBRL } from "@/lib/format";
import { onceForMonth } from "@/lib/calc";
import { categoryOf } from "@/lib/categories";
import { useApp } from "@/context/AppContext";
import type { Expense } from "@/lib/types";
import { SectionHeader } from "./SummaryCards";
import { PencilIcon } from "./icons";
import PaymentToggle from "./PaymentToggle";

export default function OnceSection({
  expenses,
  monthKey,
}: {
  expenses: Expense[];
  monthKey: string;
}) {
  const { categories, openEditExpense } = useApp();
  const lookup = useCallback(
    (key: string) => categoryOf(categories, key, "expense"),
    [categories]
  );
  const rows = onceForMonth(expenses, monthKey);
  if (rows.length === 0) return null;
  const total = rows.reduce((acc, e) => acc + e.amount, 0);

  return (
    <section aria-label="Despesas únicas do mês">
      <SectionHeader title={`Únicas · ${fmtBRL(total)}`} />
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((e) => {
          const cat = lookup(e.category);
          return (
            <li key={e.id}>
              <div className="flex items-center gap-3 px-3 py-1.5">
                <PaymentToggle expenseId={e.id} monthKey={monthKey} />
                <button
                  onClick={() => openEditExpense(e)}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-base dark:bg-orange-500/10"
                  >
                    {cat.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {e.description}
                      </span>
                      <PencilIcon className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                    </span>
                    <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-orange-600/80 dark:text-orange-400/80">
                      Única
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {fmtBRL(e.amount)}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
