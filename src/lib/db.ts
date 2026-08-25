import type { Category, Expense, ExpenseType, Payment } from "./types";
import { monthKeyToDay } from "./months";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TYPE_VALUES: ExpenseType[] = ["fixed", "installment", "once"];

export function toExpense(row: any): Expense {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    description: String(row.description),
    category: String(row.category ?? "outros"),
    kind: row.kind === "income" ? "income" : "expense",
    type: TYPE_VALUES.includes(row.type) ? row.type : "fixed",
    amount: Number(row.amount),
    installments: row.installments == null ? null : Number(row.installments),
    startMonth: row.start_month ? String(row.start_month).slice(0, 7) : null,
    referenceMonth: row.reference_month ? String(row.reference_month).slice(0, 7) : null,
    carryForward: Boolean(row.carry_forward),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function toDbRow(expense: Omit<Expense, "userId" | "createdAt">): Record<string, unknown> {
  const isIncome = expense.kind === "income";
  const isInstallment = !isIncome && expense.type === "installment";
  const hasReferenceMonth = isIncome || expense.type === "fixed" || expense.type === "once";
  return {
    ...(expense.id ? { id: expense.id } : {}),
    description: expense.description,
    category: expense.category,
    kind: isIncome ? "income" : "expense",
    type: expense.type,
    amount: expense.amount,
    installments: isInstallment ? (expense.installments ?? 2) : null,
    start_month: isInstallment ? monthKeyToDay(expense.startMonth ?? "") : null,
    reference_month: hasReferenceMonth ? monthKeyToDay(expense.referenceMonth ?? "") : null,
    carry_forward: expense.carryForward ?? false,
  };
}

export function toCategory(row: any): Category {
  return {
    userId: String(row.user_id),
    key: String(row.key),
    label: String(row.label),
    emoji: String(row.emoji ?? "📦"),
    kind: row.kind === "income" ? "income" : "expense",
    sortOrder: Number(row.sort_order ?? 100),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export function toPayment(row: any): Payment {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    expenseId: String(row.expense_id),
    month: String(row.month).slice(0, 7),
    paid: Boolean(row.paid),
    paidAt: String(row.paid_at ?? new Date().toISOString()),
  };
}

export function toPaymentDbRow(payment: { expenseId: string; month: string; paid: boolean }): Record<string, unknown> {
  return {
    expense_id: payment.expenseId,
    month: monthKeyToDay(payment.month),
    paid: payment.paid,
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
    kind: category.kind === "income" ? "income" : "expense",
    sort_order: category.sortOrder,
  };
}
