"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fmtBRL } from "@/lib/format";
import {
  categoryTotals,
  incomeExpenseSeries,
  monthlyAverages,
  monthlyValue,
  statsForMonth,
  topExpenses,
  yearSummary,
} from "@/lib/calc";
import { installmentStatus, monthShort, shiftMonth } from "@/lib/months";
import { categoryOf } from "@/lib/categories";
import type { Expense } from "@/lib/types";
import Header from "./Header";
import DeltaBadge from "./DeltaBadge";
import { EmptyHint } from "./FixedSection";

const DONUT_COLORS = [
  "#10b981", "#0ea5e9", "#f59e0b", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#ec4899",
  "#84cc16", "#64748b", "#a855f7", "#06b6d4",
];

export default function DashboardScreen({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const { expenses, dataLoading, error: dataError, setDialogMonth } = useApp();

  useEffect(() => {
    setDialogMonth(monthKey);
  }, [monthKey, setDialogMonth]);

  const cur = statsForMonth(expenses, monthKey);

  return (
    <div className="min-h-dvh bg-zinc-50 pb-28 dark:bg-zinc-950">
      <Header monthKey={monthKey} onMonthChange={onMonthChange} />

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        {dataError && (
          <p
            role="alert"
            className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          >
            {dataError}
          </p>
        )}
        {dataLoading ? (
          <div className="space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70" />
            ))}
          </div>
        ) : (
          <>
            <YearSummary expenses={expenses} monthKey={monthKey} />
            <IncomeExpenseChart expenses={expenses} monthKey={monthKey} />
            <CategoryDonut expenses={expenses} monthKey={monthKey} />
            <TopExpensesList expenses={expenses} monthKey={monthKey} />
            <MonthlyAverageCard expenses={expenses} monthKey={monthKey} />

            <p className="pt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
              Saldo atual do mês selecionado: {fmtBRL(cur.balance)}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function CardShell({
  title,
  children,
  right,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function YearSummary({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const summary = yearSummary(expenses, monthKey);
  const items = [
    { label: "Receitas do ano", value: summary.income, color: "text-teal-600 dark:text-teal-400" },
    { label: "Despesas do ano", value: summary.expense, color: "text-red-600 dark:text-red-400" },
    {
      label: "Saldo do ano",
      value: summary.balance,
      color:
        summary.balance >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
    },
  ];
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Resumo de {summary.year} · jan–{monthShort(monthKey)}
      </h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className={`text-base font-bold tabular-nums leading-tight sm:text-lg ${item.color}`}>
              {fmtBRL(item.value)}
            </p>
            <p className="mt-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function IncomeExpenseChart({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const keys = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey, -5 + i));
  const series = incomeExpenseSeries(expenses, keys);
  const max = Math.max(...series.flatMap((p) => [p.income, p.expense]), 1);

  return (
    <CardShell
      title="Receitas × Despesas"
      right={
        <span className="flex items-center gap-3 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Receitas
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Despesas
          </span>
        </span>
      }
    >
      <div className="flex h-40 items-end justify-between gap-2">
        {series.map((point) => {
          const selected = point.key === monthKey;
          const incomeH = Math.max(point.income > 0 ? 4 : 0, (point.income / max) * 100);
          const expenseH = Math.max(point.expense > 0 ? 4 : 0, (point.expense / max) * 100);
          return (
            <div key={point.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex h-full w-full items-end justify-center gap-1">
                <span
                  title={`Receitas ${monthShort(point.key)}: ${fmtBRL(point.income)}`}
                  className={`w-1/3 rounded-t-md transition-colors ${
                    selected ? "bg-teal-500" : "bg-teal-300 dark:bg-teal-700"
                  }`}
                  style={{ height: `${incomeH}%` }}
                />
                <span
                  title={`Despesas ${monthShort(point.key)}: ${fmtBRL(point.expense)}`}
                  className={`w-1/3 rounded-t-md transition-colors ${
                    selected ? "bg-red-500" : "bg-red-300 dark:bg-red-800"
                  }`}
                  style={{ height: `${expenseH}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  selected
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {monthShort(point.key)}
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function CategoryDonut({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const { categories } = useApp();
  const stats = categoryTotals(expenses, monthKey);
  const total = stats.reduce((acc, s) => acc + s.total, 0);

  if (stats.length === 0 || total === 0) {
    return (
      <CardShell title="Gastos por categoria">
        <EmptyHint emoji="🍩" text="Nenhuma despesa neste mês para distribuir por categoria." />
      </CardShell>
    );
  }

  const R = 15.915; // circunferência = 100 (stroke-dasharray em %)
  let offset = 25;

  return (
    <CardShell
      title="Gastos por categoria"
      right={<span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmtBRL(total)}</span>}
    >
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0" role="img" aria-label="Distribuição de gastos por categoria">
          <circle cx="21" cy="21" r={R} fill="transparent" stroke="currentColor" strokeWidth="5" className="text-zinc-100 dark:text-zinc-800" />
          {stats.map((s, i) => {
            const cat = categoryOf(categories, s.key);
            const pct = (s.total / total) * 100;
            const dash = Math.max(pct - 0.5, 0.5);
            const circle = (
              <circle
                key={s.key}
                cx="21"
                cy="21"
                r={R}
                fill="transparent"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="5"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offset}
              >
                <title>{`${cat.label}: ${fmtBRL(s.total)}`}</title>
              </circle>
            );
            offset -= pct;
            return circle;
          })}
        </svg>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {stats.slice(0, 6).map((s, i) => {
            const cat = categoryOf(categories, s.key);
            return (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <span aria-hidden className="text-sm">{cat.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{cat.label}</span>
                <DeltaBadge current={s.total} previous={s.previousTotal} size="xs" />
                <span className="shrink-0 tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                  {fmtBRL(s.total)}
                </span>
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              </li>
            );
          })}
          {stats.length > 6 && (
            <li className="pl-7 text-[10px] text-zinc-400">
              + {stats.length - 6} outras categorias
            </li>
          )}
        </ul>
      </div>
    </CardShell>
  );
}

function TopExpensesList({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const { categories, openEditExpense } = useApp();
  const top = topExpenses(expenses, monthKey, 5);

  return (
    <CardShell title={`Maiores despesas · ${monthShort(monthKey)}`}>
      {top.length === 0 ? (
        <EmptyHint emoji="🏆" text="Nenhuma despesa neste mês." />
      ) : (
        <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {top.map((e, i) => {
            const st =
              e.kind === "expense" && e.type === "installment"
                ? installmentStatus(e, monthKey)
                : null;
            return (
              <li key={e.id}>
                <button
                  onClick={() => openEditExpense(e)}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-300 dark:text-zinc-600">
                    {i + 1}
                  </span>
                  <span aria-hidden className="text-base">{categoryOf(categories, e.category).emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
                    {e.description}
                    {st && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {st.index}/{e.installments}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {fmtBRL(monthlyValue(e, monthKey))}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </CardShell>
  );
}

function MonthlyAverageCard({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const avg = monthlyAverages(expenses, monthKey, 6);
  return (
    <CardShell title="Média mensal · últimos 6 meses">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Receitas</dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
            {fmtBRL(avg.income)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Despesas</dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
            {fmtBRL(avg.expense)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Saldo</dt>
          <dd
            className={`mt-1 text-sm font-bold tabular-nums ${
              avg.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {fmtBRL(avg.balance)}
          </dd>
        </div>
      </dl>
    </CardShell>
  );
}
