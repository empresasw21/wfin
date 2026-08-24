import type { Expense } from "./types";
import { monthKeyToDay } from "./months";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toExpense(row: any): Expense {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    description: String(row.description),
    category: String(row.category),
    type: row.type === "installment" ? "installment" : "fixed",
    amount: Number(row.amount),
    installments: row.installments == null ? null : Number(row.installments),
    startMonth: row.start_month ? String(row.start_month).slice(0, 7) : null,
    referenceMonth: row.reference_month ? String(row.reference_month).slice(0, 7) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

type ExpenseRow = Omit<Expense, "userId" | "createdAt"> & { userId?: string };

export function toDbRow(expense: ExpenseRow): Record<string, unknown> {
  return {
    ...(expense.id ? { id: expense.id } : {}),
    description: expense.description,
    category: expense.category,
    type: expense.type,
    amount: expense.amount,
    installments:
      expense.type === "installment" ? (expense.installments ?? 2) : null,
    start_month:
      expense.type === "installment"
        ? monthKeyToDay(expense.startMonth ?? "")
        : null,
    reference_month: expense.type === "fixed" ? monthKeyToDay(expense.referenceMonth ?? "") : null,
  };
}
