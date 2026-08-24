"use client";

import { useState } from "react";
import { fmtBRL } from "@/lib/format";
import { compareFixed } from "@/lib/calc";
import { categoryOf } from "@/lib/categories";
import { useApp } from "@/context/AppContext";
import type { Expense, ExpenseKind } from "@/lib/types";
import DeltaBadge from "./DeltaBadge";
import { SectionHeader } from "./SummaryCards";
import { CopyIcon, PencilIcon } from "./icons";

export function EmptyHint({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-2xl" aria-hidden>{emoji}</p>
      <p className="mx-auto mt-2 max-w-[26ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function MonthlyEntriesSection({
  kind,
  expenses,
  monthKey,
  copying,
  onCopyPrevious,
}: {
  kind: ExpenseKind;
  expenses: Expense[];
  monthKey: string;
  copying: boolean;
  onCopyPrevious: () => void;
}) {
  const { categories, openEditExpense } = useApp();
  const lookup = (key: string) => categoryOf(categories, key);
  const { rows, absent } = compareFixed(expenses, monthKey, kind);
  const [showAbsent, setShowAbsent] = useState(false);
  const total = rows.reduce((acc, r) => acc + r.currentTotal, 0);
  const canCopy = absent.length > 0;

  const title = kind === "income" ? `Receitas · ${fmtBRL(total)}` : `Fixas · ${fmtBRL(total)}`;
  const copyLabel = "Copiar mês anterior";

  return (
    <section aria-label={kind === "income" ? "Receitas do mês" : "Despesas fixas do mês"}>
      <SectionHeader
        title={title}
        right={
          canCopy ? (
            <button
              onClick={onCopyPrevious}
              disabled={copying}
              title={
                kind === "income"
                  ? "Copiar receitas não registradas do mês anterior"
                  : "Copiar despesas fixas não registradas do mês anterior"
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copying ? "Copiando..." : copyLabel}
            </button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyHint
          emoji={kind === "income" ? "💵" : "📌"}
          text={
            absent.length > 0
              ? kind === "income"
                ? "Nenhuma receita neste mês. Copie as do mês anterior ou adicione manualmente."
                : "Nenhuma despesa fixa neste mês. Copie as do mês anterior ou adicione manualmente."
              : kind === "income"
                ? "Nenhuma receita registrada neste mês."
                : "Nenhuma despesa fixa registrada neste mês."
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map(({ expense, kind: change, previousTotal }) => {
            const cat = lookup(expense.category);
            return (
              <li key={expense.id}>
                <button
                  onClick={() => openEditExpense(expense)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                >
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                      kind === "income"
                        ? "bg-teal-50 dark:bg-teal-500/10"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
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
                        previous={change === "new" ? null : previousTotal}
                        size="xs"
                        invert={kind === "income"}
                      />
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      kind === "income"
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {kind === "income" ? "+" : ""}
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
            {showAbsent ? "▾" : "▸"} {absent.length} registro{absent.length > 1 ? "s" : ""} do mês
            anterior não {absent.length > 1 ? "registrados" : "registrado"} neste mês
          </button>
          {showAbsent && (
            <ul className="mt-2 space-y-1 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
              {absent.map((e) => {
                const cat = lookup(e.category);
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

export function FixedSection(props: CommonProps) {
  return <MonthlyEntriesSection kind="expense" {...props} />;
}

export function IncomeSection(props: CommonProps) {
  return <MonthlyEntriesSection kind="income" {...props} />;
}

interface CommonProps {
  expenses: Expense[];
  monthKey: string;
  onCopyPrevious: () => void;
  copying: boolean;
}
