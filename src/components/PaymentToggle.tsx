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
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        paid
          ? "bg-emerald-500"
          : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          paid ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
