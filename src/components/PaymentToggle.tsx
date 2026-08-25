"use client";

import { useApp } from "@/context/AppContext";

export default function PaymentToggle({
  expenseId,
  monthKey,
}: {
  expenseId: string;
  monthKey: string;
}) {
  const { isPaid, togglePayment } = useApp();
  const paid = isPaid(expenseId, monthKey);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={paid}
      aria-label={paid ? "Despesa paga — clique para desmarcar" : "Despesa pendente — clique para marcar como paga"}
      onClick={(e) => {
        e.stopPropagation();
        togglePayment(expenseId, monthKey, !paid);
      }}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        paid
          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-400"
          : "border-zinc-300 bg-zinc-50 text-zinc-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-600 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
      }`}
    >
      {paid ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="10" cy="10" r="6" />
        </svg>
      )}
    </button>
  );
}
