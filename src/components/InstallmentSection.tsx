"use client";

import { fmtBRL } from "@/lib/format";
import { remainingAmount } from "@/lib/calc";
import { installmentStatus, monthLabel, shiftMonth } from "@/lib/months";
import { categoryOf } from "@/lib/categories";
import { useApp } from "@/context/AppContext";
import type { Expense } from "@/lib/types";
import { EmptyHint } from "./FixedSection";
import { SectionHeader } from "./SummaryCards";

export default function InstallmentSection({
  expenses,
  prevExpenses,
  monthKey,
}: {
  expenses: Expense[];
  prevExpenses: Expense[];
  monthKey: string;
}) {
  const { categories, openEditExpense } = useApp();
  const active = expenses.filter(
    (e) => e.kind === "expense" && e.type === "installment" && installmentStatus(e, monthKey).active
  );
  const total = active.reduce((acc, e) => acc + e.amount / e.installments!, 0);
  const prevActiveIds = new Set(
    prevExpenses
      .filter((e) => e.type === "installment" && installmentStatus(e, shiftMonth(monthKey, -1)).active)
      .map((e) => e.id)
  );

  return (
    <section aria-label="Despesas parceladas ativas no mês">
      <SectionHeader title={`Parceladas · ${fmtBRL(total)}/mês`} />
      {active.length === 0 ? (
        <EmptyHint emoji="🧾" text="Nenhuma compra parcelada ativa neste mês." />
      ) : (
        <ul className="space-y-2">
          {active.map((e) => {
            const st = installmentStatus(e, monthKey);
            const perMonth = e.amount / e.installments!;
            const progress = Math.min(100, (st.index / e.installments!) * 100);
            const isNewThisMonth = !prevActiveIds.has(e.id);

            return (
              <li key={e.id}>
                <button
                  onClick={() => openEditExpense(e)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-base dark:bg-zinc-800"
                    >
                      {categoryOf(categories, e.category).emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {e.description}
                        </span>
                        {isNewThisMonth && (
                          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                            nova
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                        Parcela {st.index} de {e.installments}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {fmtBRL(perMonth)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-valuenow={st.index}
                      aria-valuemin={1}
                      aria-valuemax={e.installments ?? undefined}
                      aria-label={`Progresso do parcelamento de ${e.description}`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                    Faltam {st.remainingMonths} parcela{st.remainingMonths > 1 ? "s" : ""} ·{" "}
                    {fmtBRL(remainingAmount(e, monthKey))} restantes · termina em{" "}
                    {monthLabel(st.endKey)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
