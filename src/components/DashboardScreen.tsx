"use client";

import { useEffect, useState } from "react";
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
import type { Expense, Payment } from "@/lib/types";
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
  const { expenses, payments, dataLoading, error: dataError, setDialogMonth } = useApp();

  useEffect(() => {
    setDialogMonth(monthKey);
  }, [monthKey, setDialogMonth]);

  return (
    <div className="min-h-dvh bg-zinc-50 pb-28 dark:bg-zinc-950 lg:pb-10">
      <Header monthKey={monthKey} onMonthChange={onMonthChange} />

      <main className="mx-auto w-full max-w-lg space-y-5 px-4 pt-4 md:max-w-3xl lg:max-w-5xl">
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
            <KpiCards expenses={expenses} payments={payments} monthKey={monthKey} />

            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
              <IncomeExpenseChart expenses={expenses} monthKey={monthKey} onMonthChange={onMonthChange} />
              <CategoryDonut expenses={expenses} monthKey={monthKey} />
            </div>

            <BalanceLineChart expenses={expenses} monthKey={monthKey} onMonthChange={onMonthChange} />
            <TopExpensesList expenses={expenses} monthKey={monthKey} />

            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
              <YearSummary expenses={expenses} monthKey={monthKey} />
              <MonthlyAverageCard expenses={expenses} monthKey={monthKey} />
            </div>
          </>
        )}

        <p className="pt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          WFin · suas finanças, mês a mês
        </p>
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

/* ──────────────── KPI Cards ──────────────── */

function KpiCards({
  expenses,
  payments,
  monthKey,
}: {
  expenses: Expense[];
  payments: Payment[];
  monthKey: string;
}) {
  const cur = statsForMonth(expenses, monthKey, payments);
  const prev = statsForMonth(expenses, shiftMonth(monthKey, -1), payments);

  const kpis = [
    {
      label: "Saldo",
      value: cur.balance,
      color: cur.balance >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
      bg: cur.balance >= 0
        ? "bg-emerald-50 dark:bg-emerald-500/10"
        : "bg-red-50 dark:bg-red-500/10",
      emoji: cur.balance >= 0 ? "📈" : "📉",
      prevValue: prev.balance,
      invertDelta: true,
    },
    {
      label: "Receitas",
      value: cur.incomeTotal,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-500/10",
      emoji: "💰",
      prevValue: prev.incomeTotal,
      invertDelta: true,
    },
    {
      label: "Despesas",
      value: cur.total,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
      emoji: "💸",
      prevValue: prev.total,
      invertDelta: false,
    },
    {
      label: "Falta pagar",
      value: cur.remainingTotal,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      emoji: "⏳",
      prevValue: null,
      invertDelta: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => {
        const pctChange =
          kpi.prevValue !== null && kpi.prevValue !== 0
            ? ((kpi.value - kpi.prevValue) / Math.abs(kpi.prevValue)) * 100
            : null;
        return (
          <div
            key={kpi.label}
            className={`rounded-2xl p-3 shadow-sm sm:p-4 ${kpi.bg} border border-zinc-100 dark:border-zinc-800`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>{kpi.emoji}</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</span>
            </div>
            <p className={`mt-2 text-lg font-bold tabular-nums leading-tight sm:text-xl ${kpi.color}`}>
              {fmtBRL(kpi.value)}
            </p>
            {pctChange !== null && (
              <DeltaBadge current={kpi.value} previous={kpi.prevValue} size="xs" invert={kpi.invertDelta} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────── Income × Expense Chart ──────────────── */

function IncomeExpenseChart({
  expenses,
  monthKey,
  onMonthChange,
}: {
  expenses: Expense[];
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
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
      <div className="flex h-44 items-end justify-between gap-1.5 sm:gap-2">
        {series.map((point) => {
          const selected = point.key === monthKey;
          const incomeH = Math.max(point.income > 0 ? 3 : 0, (point.income / max) * 100);
          const expenseH = Math.max(point.expense > 0 ? 3 : 0, (point.expense / max) * 100);
          return (
            <button
              key={point.key}
              onClick={() => onMonthChange(point.key)}
              className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1"
            >
              {selected && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                    {fmtBRL(point.income)}
                  </span>
                  <span className="text-[8px] font-semibold tabular-nums text-red-500 dark:text-red-400">
                    {fmtBRL(point.expense)}
                  </span>
                </div>
              )}
              <div className="flex h-full w-full items-end justify-center gap-0.5 sm:gap-1">
                <span
                  title={`Receitas ${monthShort(point.key)}: ${fmtBRL(point.income)}`}
                  className={`w-2/5 rounded-t-md transition-colors ${
                    selected
                      ? "bg-teal-500"
                      : "bg-teal-200 group-hover:bg-teal-300 dark:bg-teal-800 dark:group-hover:bg-teal-700"
                  }`}
                  style={{ height: `${incomeH}%` }}
                />
                <span
                  title={`Despesas ${monthShort(point.key)}: ${fmtBRL(point.expense)}`}
                  className={`w-2/5 rounded-t-md transition-colors ${
                    selected
                      ? "bg-red-500"
                      : "bg-red-200 group-hover:bg-red-300 dark:bg-red-800 dark:group-hover:bg-red-700"
                  }`}
                  style={{ height: `${expenseH}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  selected
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                }`}
              >
                {monthShort(point.key)}
              </span>
            </button>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ──────────────── Category Donut ──────────────── */

function CategoryDonut({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const { categories } = useApp();
  const stats = categoryTotals(expenses, monthKey);
  const total = stats.reduce((acc, s) => acc + s.total, 0);
  const [expanded, setExpanded] = useState(false);

  if (stats.length === 0 || total === 0) {
    return (
      <CardShell title="Gastos por categoria">
        <EmptyHint emoji="🍩" text="Nenhuma despesa neste mês para distribuir por categoria." />
      </CardShell>
    );
  }

  const shown = expanded ? stats : stats.slice(0, 4);
  const R = 15.915;
  let offset = 25;

  return (
    <CardShell
      title="Gastos por categoria"
      right={<span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmtBRL(total)}</span>}
    >
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 42 42" className="h-40 w-40 shrink-0" role="img" aria-label="Distribuição de gastos por categoria">
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
                <title>{`${cat.label}: ${fmtBRL(s.total)} (${Math.round(pct)}%)`}</title>
              </circle>
            );
            offset -= pct;
            return circle;
          })}
        </svg>
        <ul className="min-w-0 flex-1 space-y-2">
          {shown.map((s, i) => {
            const cat = categoryOf(categories, s.key);
            const pct = Math.round((s.total / total) * 100);
            return (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span aria-hidden className="text-sm">{cat.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{cat.label}</span>
                <span className="shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{pct}%</span>
                <span className="shrink-0 tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                  {fmtBRL(s.total)}
                </span>
              </li>
            );
          })}
          {stats.length > 4 && (
            <li>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {expanded ? "Recolher" : `+ ${stats.length - 4} outras categorias`}
              </button>
            </li>
          )}
        </ul>
      </div>
    </CardShell>
  );
}

/* ──────────────── Balance Line Chart ──────────────── */

function BalanceLineChart({
  expenses,
  monthKey,
  onMonthChange,
}: {
  expenses: Expense[];
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const keys = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey, -5 + i));
  const points = keys.map((k) => ({ key: k, balance: statsForMonth(expenses, k).balance }));
  const values = points.map((p) => p.balance);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal || 1;
  const pad = 20;
  const w = 100;
  const h = 50;

  const toX = (i: number) => pad + (i / (keys.length - 1)) * (w - 2 * pad);
  const toY = (v: number) => pad + ((maxVal - v) / range) * (h - 2 * pad);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.balance).toFixed(1)}`)
    .join(" ");

  const zeroY = toY(0);
  const areaPosD = `${pathD} L${toX(keys.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${toX(0).toFixed(1)},${zeroY.toFixed(1)} Z`;
  const areaNegD = `${pathD} L${toX(keys.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${toX(0).toFixed(1)},${zeroY.toFixed(1)} Z`;

  const isPositive = points.every((p) => p.balance >= 0);
  const lineColor = isPositive ? "#10b981" : points.some((p) => p.balance < 0) ? "#ef4444" : "#10b981";

  return (
    <CardShell title="Evolução do saldo">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "10rem" }} role="img" aria-label="Evolução do saldo mensal">
        <defs>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Zero line */}
        <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="currentColor" strokeWidth="0.3" className="text-zinc-200 dark:text-zinc-700" strokeDasharray="2,2" />

        {/* Area fill */}
        <path d={areaPosD} fill="url(#balanceGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => {
          const selected = p.key === monthKey;
          const cx = toX(i);
          const cy = toY(p.balance);
          return (
            <g key={p.key}>
              <circle cx={cx} cy={cy} r={selected ? 2.5 : 1.5} fill={lineColor} stroke="white" strokeWidth="0.8" className="dark:stroke-zinc-900" />
              {selected && (
                <>
                  <rect x={cx - 8} y={cy - 7} width="16" height="4.5" rx="1" fill={lineColor} opacity="0.9" />
                  <text x={cx} y={cy - 3.8} textAnchor="middle" fontSize="2.8" fontWeight="600" fill="white" fontFamily="sans-serif">
                    {fmtBRL(p.balance)}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Month labels */}
        {points.map((p, i) => (
          <text
            key={p.key}
            x={toX(i)}
            y={h - 4}
            textAnchor="middle"
            fontSize="3.5"
            fontWeight={p.key === monthKey ? "600" : "400"}
            fill={p.key === monthKey ? lineColor : "#a1a1aa"}
            fontFamily="sans-serif"
          >
            {monthShort(p.key)}
          </text>
        ))}
      </svg>
    </CardShell>
  );
}

/* ──────────────── Top Expenses ──────────────── */

function TopExpensesList({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const { categories, openEditExpense } = useApp();
  const top = topExpenses(expenses, monthKey, 5);
  const totalMonth = top.reduce((acc, e) => acc + monthlyValue(e, monthKey), 0);

  if (top.length === 0) {
    return (
      <CardShell title={`Maiores despesas · ${monthShort(monthKey)}`}>
        <EmptyHint emoji="🏆" text="Nenhuma despesa neste mês." />
      </CardShell>
    );
  }

  const maxVal = top.length > 0 ? monthlyValue(top[0], monthKey) : 1;

  return (
    <CardShell
      title={`Maiores despesas · ${monthShort(monthKey)}`}
      right={<span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">do total de {fmtBRL(totalMonth)}</span>}
    >
      <ol className="space-y-3">
        {top.map((e, i) => {
          const st =
            e.kind === "expense" && e.type === "installment"
              ? installmentStatus(e, monthKey)
              : null;
          const val = monthlyValue(e, monthKey);
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <li key={e.id}>
              <button
                onClick={() => openEditExpense(e)}
                className="flex w-full items-center gap-3 text-left transition-colors hover:opacity-80"
              >
                <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-300 dark:text-zinc-600">
                  {i + 1}
                </span>
                <span aria-hidden className="text-base">{categoryOf(categories, e.category).emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {e.description}
                    </span>
                    {st && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {st.index}/{e.installments}
                      </span>
                    )}
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {fmtBRL(val)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </CardShell>
  );
}

/* ──────────────── Year Summary ──────────────── */

function YearSummary({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const summary = yearSummary(expenses, monthKey);
  const items = [
    { label: "Receitas", value: summary.income, color: "text-teal-600 dark:text-teal-400" },
    { label: "Despesas", value: summary.expense, color: "text-red-600 dark:text-red-400" },
    {
      label: "Saldo",
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
        Resumo {summary.year} · jan–{monthShort(monthKey)}
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

/* ──────────────── Monthly Averages ──────────────── */

function MonthlyAverageCard({ expenses, monthKey }: { expenses: Expense[]; monthKey: string }) {
  const avg = monthlyAverages(expenses, monthKey, 6);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Média · 6 meses
      </h2>
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
    </section>
  );
}
