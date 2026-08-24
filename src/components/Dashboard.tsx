"use client";

import { useCallback, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Expense, ExpenseInput } from "@/lib/types";
import Header from "./Header";
import SummaryCards from "./SummaryCards";
import FixedSection from "./FixedSection";
import InstallmentSection from "./InstallmentSection";
import MonthChart from "./MonthChart";
import ExpenseModal from "./ExpenseModal";
import { PlusIcon } from "./icons";

export default function Dashboard({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const {
    expenses,
    dataLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    copyFixedFromPreviousMonth,
  } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [copying, setCopying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openNew = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((expense: Expense) => {
    setEditing(expense);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (input: ExpenseInput) => {
      setActionError(null);
      if (editing) await updateExpense(editing.id, input);
      else await addExpense(input);
    },
    [editing, updateExpense, addExpense]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setActionError(null);
      await deleteExpense(id);
    },
    [deleteExpense]
  );

  const handleCopyPrevious = useCallback(async () => {
    setCopying(true);
    setActionError(null);
    try {
      const count = await copyFixedFromPreviousMonth(monthKey);
      if (count === 0) setActionError("Nada para copiar: todas as fixas do mês anterior já estão registradas.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao copiar despesas.");
    } finally {
      setCopying(false);
    }
  }, [copyFixedFromPreviousMonth, monthKey]);

  return (
    <div className="min-h-dvh bg-zinc-50 pb-28 dark:bg-zinc-950">
      <Header monthKey={monthKey} onMonthChange={onMonthChange} />

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        {actionError && (
          <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            {actionError}
          </p>
        )}

        <SummaryCards expenses={expenses} monthKey={monthKey} />

        {dataLoading ? (
          <div className="space-y-2" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
            ))}
          </div>
        ) : (
          <>
            <FixedSection
              expenses={expenses}
              monthKey={monthKey}
              onEdit={openEdit}
              onCopyPrevious={handleCopyPrevious}
              copying={copying}
            />
            <InstallmentSection
              expenses={expenses}
              prevExpenses={expenses}
              monthKey={monthKey}
              onEdit={openEdit}
            />
            <MonthChart expenses={expenses} monthKey={monthKey} onSelect={onMonthChange} />
          </>
        )}

        <p className="pt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          WFin · suas finanças, mês a mês
        </p>
      </main>

      <button
        onClick={openNew}
        aria-label="Adicionar despesa"
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 sm:right-auto sm:left-[calc(50%+16rem)]"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <ExpenseModal
        open={modalOpen}
        expense={editing}
        defaultMonth={monthKey}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
