"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import Header from "./Header";
import SummaryCards from "./SummaryCards";
import { FixedSection, IncomeSection } from "./FixedSection";
import InstallmentSection from "./InstallmentSection";
import OnceSection from "./OnceSection";
import MonthChart from "./MonthChart";
import GroupSection from "./GroupSection";

export default function MonthView({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const {
    expenses,
    payments,
    dataLoading,
    error: dataError,
    copyFromPreviousMonth,
    setDialogMonth,
  } = useApp();
  const [copyingKind, setCopyingKind] = useState<"expense" | "income" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"receitas" | "despesas">("despesas");

  // Despesas sem grupo para as seções regulares (fixas, únicas, parceladas)
  const ungroupedExpenses = useMemo(
    () => expenses.filter((e) => !e.groupId),
    [expenses]
  );

  useEffect(() => {
    setDialogMonth(monthKey);
  }, [monthKey, setDialogMonth]);

  const handleCopyPrevious = useCallback(
    async (kind: "expense" | "income") => {
      setCopyingKind(kind);
      setActionError(null);
      try {
        await copyFromPreviousMonth(monthKey, kind);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Erro ao copiar lançamentos.");
      } finally {
        setCopyingKind(null);
      }
    },
    [copyFromPreviousMonth, monthKey]
  );

  return (
    <div className="min-h-dvh bg-zinc-50 pb-28 dark:bg-zinc-950 lg:pb-10">
      <Header monthKey={monthKey} onMonthChange={onMonthChange} />

      <main className="mx-auto w-full max-w-lg space-y-5 px-4 pt-4 md:max-w-3xl lg:max-w-5xl">
        {(actionError || dataError) && (
          <p
            role="alert"
            className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          >
            {actionError ?? dataError}
          </p>
        )}

        <SummaryCards expenses={expenses} payments={payments} monthKey={monthKey} />

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {(
            [
              ["receitas", "Receitas"],
              ["despesas", "Despesas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === value
                  ? value === "receitas"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="space-y-2" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "receitas" ? (
              <>
                <IncomeSection
                  expenses={expenses}
                  monthKey={monthKey}
                  onCopyPrevious={() => handleCopyPrevious("income")}
                  copying={copyingKind === "income"}
                />
              </>
            ) : (
              <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
                <div className="space-y-5">
                  <FixedSection
                    expenses={ungroupedExpenses}
                    monthKey={monthKey}
                    onCopyPrevious={() => handleCopyPrevious("expense")}
                    copying={copyingKind === "expense"}
                  />
                </div>
                <div className="mt-5 space-y-5 lg:mt-0">
                  <OnceSection expenses={ungroupedExpenses} monthKey={monthKey} />
                  <InstallmentSection
                    expenses={ungroupedExpenses}
                    prevExpenses={expenses}
                    monthKey={monthKey}
                  />
                  <GroupSection expenses={expenses} monthKey={monthKey} />
                </div>
              </div>
            )}
            <MonthChart expenses={expenses} monthKey={monthKey} onSelect={onMonthChange} />
          </>
        )}

        <p className="pt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          WFin · suas finanças, mês a mês
        </p>
      </main>
    </div>
  );
}
