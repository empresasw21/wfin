import type { Expense } from "./types";
import { installmentStatus, shiftMonth } from "./months";

export interface MonthStats {
  fixedTotal: number;
  installmentTotal: number;
  total: number;
  fixedCount: number;
  activeInstallments: number;
}

export interface FixedComparison {
  expense: Expense;
  previous: Expense | null;
  currentTotal: number;
  previousTotal: number | null;
  kind: "up" | "down" | "flat" | "new";
}

function normalize(description: string): string {
  return description.trim().toLocaleLowerCase("pt-BR");
}

/** Valor mensal efetivo da despesa em um dado mês (0 se inativa). */
export function monthlyValue(expense: Expense, key: string): number {
  if (expense.type === "fixed") {
    return expense.referenceMonth === key ? expense.amount : 0;
  }
  return installmentStatus(expense, key).active ? expense.amount / expense.installments! : 0;
}

export function fixedForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses
    .filter((e) => e.type === "fixed" && e.referenceMonth === key)
    .sort((a, b) => a.description.localeCompare(b.description, "pt-BR"));
}

export function installmentsForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses
    .filter((e) => e.type === "installment" && installmentStatus(e, key).active)
    .sort(
      (a, b) =>
        installmentStatus(a, key).index - installmentStatus(b, key).index ||
        a.description.localeCompare(b.description, "pt-BR")
    );
}

export function statsForMonth(expenses: Expense[], key: string): MonthStats {
  let fixedTotal = 0;
  let installmentTotal = 0;
  let fixedCount = 0;
  let activeInstallments = 0;
  for (const e of expenses) {
    if (e.type === "fixed" && e.referenceMonth === key) {
      fixedTotal += e.amount;
      fixedCount += 1;
    } else if (e.type === "installment" && installmentStatus(e, key).active) {
      installmentTotal += e.amount / e.installments!;
      activeInstallments += 1;
    }
  }
  return {
    fixedTotal,
    installmentTotal,
    total: fixedTotal + installmentTotal,
    fixedCount,
    activeInstallments,
  };
}

/**
 * Compara as despesas fixas do mês `key` com o mês anterior,
 * casando por descrição (normalizada) + categoria.
 */
export function compareFixed(expenses: Expense[], key: string) {
  const prevKey = shiftMonth(key, -1);
  const prevMap = new Map<string, number>();
  for (const e of fixedForMonth(expenses, prevKey)) {
    const k = `${normalize(e.description)}::${e.category}`;
    prevMap.set(k, (prevMap.get(k) ?? 0) + e.amount);
  }

  const usedKeys = new Set<string>();
  const rows: FixedComparison[] = [];
  for (const e of fixedForMonth(expenses, key)) {
    const k = `${normalize(e.description)}::${e.category}`;
    const hasPrev = prevMap.has(k);
    const previousTotal = hasPrev ? prevMap.get(k)! : null;
    usedKeys.add(k);
    let kind: FixedComparison["kind"];
    if (!hasPrev) kind = "new";
    else if (e.amount > previousTotal!) kind = "up";
    else if (e.amount < previousTotal!) kind = "down";
    else kind = "flat";
    rows.push({ expense: e, previous: null, currentTotal: e.amount, previousTotal, kind });
  }

  const absent = fixedForMonth(expenses, prevKey).filter((e) => {
    const k = `${normalize(e.description)}::${e.category}`;
    return !usedKeys.has(k);
  });

  return { rows, absent, prevKey };
}

/** Totais mensais de uma lista de chaves de mês. */
export function monthlyTotals(expenses: Expense[], keys: string[]): number[] {
  return keys.map((k) => statsForMonth(expenses, k).total);
}

/** Valor total restante de uma despesa parcelada a partir do mês informado. */
export function remainingAmount(expense: Expense, key: string): number {
  const st = installmentStatus(expense, key);
  if (!st.active) return 0;
  const perMonth = expense.amount / expense.installments!;
  return perMonth * st.remainingMonths;
}
