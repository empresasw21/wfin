import type { Category, Expense } from "./types";
import { monthKeyToDay } from "./months";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toExpense(row: any): Expense {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    description: String(row.description),
    category: String(row.category ?? "outros"),
    kind: row.kind === "income" ? "income" : "expense",
    type: row.type === "installment" ? "installment" : "fixed",
    amount: Number(row.amount),
    installments: row.installments == null ? null : Number(row.installments),
    startMonth: row.start_month ? String(row.start_month).slice(0, 7) : null,
    referenceMonth: row.reference_month ? String(row.reference_month).slice(0, 7) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function toDbRow(expense: Omit<Expense, "userId" | "createdAt">): Record<string, unknown> {
  const isIncome = expense.kind === "income";
  const isInstallment = !isIncome && expense.type === "installment";
  return {
    ...(expense.id ? { id: expense.id } : {}),
    description: expense.description,
    category: expense.category,
    kind: isIncome ? "income" : "expense",
    type: isInstallment ? "installment" : "fixed",
    amount: expense.amount,
    installments: isInstallment ? (expense.installments ?? 2) : null,
    start_month: isInstallment ? monthKeyToDay(expense.startMonth ?? "") : null,
    reference_month:
      isIncome || expense.type === "fixed"
        ? monthKeyToDay(expense.referenceMonth ?? "")
        : null,
  };
}

export function toCategory(row: any): Category {
  return {
    userId: String(row.user_id),
    key: String(row.key),
    label: String(row.label),
    emoji: String(row.emoji ?? "📦"),
    sortOrder: Number(row.sort_order ?? 100),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export function categoryToDbRow(
  category: Omit<Category, "userId" | "createdAt"> & { userId?: string }
): Record<string, unknown> {
  return {
    ...(category.userId ? { user_id: category.userId } : {}),
    key: category.key,
    label: category.label,
    emoji: category.emoji,
    sort_order: category.sortOrder,
  };
}
