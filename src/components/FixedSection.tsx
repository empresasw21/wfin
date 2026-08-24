"use client";

import { useState } from "react";
import { fmtBRL } from "@/lib/format";
import { compareFixed } from "@/lib/calc";
import { categoryOf, type Expense } from "@/lib/types";
import DeltaBadge from "./DeltaBadge";
import { SectionHeader } from "./SummaryCards";
import { CopyIcon, PencilIcon } from "./icons";

export default function FixedSection({
  expenses,
  monthKey,
  onEdit,
  onCopyPrevious,
  copying,
}: {
  expenses: Expense[];
  monthKey: string;
  onEdit: (expense: Expense) => void;
  onCopyPrevious: () => void;
  copying: boolean;
}) {
  const { rows, absent } = compareFixed(expenses, monthKey);
  const [showAbsent, setShowAbsent] = useState(false);
  const total = rows.reduce((acc, r) => acc + r.currentTotal, 0);
  const canCopy = absent.length > 0;

  return (
    <section aria-label="Despesas fixas do mês">
      <SectionHeader
        title={`Fixas · ${fmtBRL(total)}`}
        right={
          canCopy ? (
            <button
              onClick={onCopyPrevious}
              disabled={copying}
              title="Copiar despesas fixas não registradas do mês anterior"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copying ? "Copiando..." : "Copiar mês anterior"}
            </button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyHint
          emoji="📌"
          text={
            absent.length > 0
              ? "Nenhuma despesa fixa neste mês. Copie as do mês anterior ou adicione manualmente."
              : "Nenhuma despesa fixa registrada neste mês."
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map(({ expense, kind, previousTotal }) => {
            const cat = categoryOf(expense.category);
            return (
              <li key={expense.id}>
                <button
                  onClick={() => onEdit(expense)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-base dark:bg-zinc-800"
                  >
                    {cat.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {expense.description}
                      </span>
                      <PencilIcon className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <DeltaBadge
                        current={expense.amount}
                        previous={kind === "new" ? null : previousTotal}
                        size="xs"
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {fmtBRL(expense.amount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {absent.length > 0 && rows.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowAbsent((v) => !v)}
            className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
          >
            {showAbsent ? "▾" : "▸"} {absent.length} conta{absent.length > 1 ? "s" : ""} do mês anterior
            {absent.length > 1 ? " não" : " não"} registrada{absent.length > 1 ? "s" : ""} neste mês
          </button>
          {showAbsent && (
            <ul className="mt-2 space-y-1 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
              {absent.map((e) => {
                const cat = categoryOf(e.category);
                return (
                  <li key={e.id} className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">
                      {cat.emoji} {e.description}
                    </span>
                    <span className="tabular-nums">{fmtBRL(e.amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export function EmptyHint({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-2xl" aria-hidden>{emoji}</p>
      <p className="mx-auto mt-2 max-w-[26ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}
