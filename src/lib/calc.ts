import type { Expense, ExpenseKind } from "./types";
import { installmentStatus, shiftMonth } from "./months";

export interface MonthStats {
  fixedTotal: number;
  installmentTotal: number;
  onceTotal: number;
  /** Total de despesas do mês (fixas + parcelas + únicas). */
  total: number;
  /** Total de receitas do mês. */
  incomeTotal: number;
  /** Saldo do mês: receitas − despesas. */
  balance: number;
  fixedCount: number;
  activeInstallments: number;
  onceCount: number;
  incomeCount: number;
}

export interface FixedComparison {
  expense: Expense;
  previous: Expense | null;
  currentTotal: number;
  previousTotal: number | null;
  kind: "up" | "down" | "flat" | "new";
}

export interface CategoryStat {
  key: string;
  total: number;
  previousTotal: number | null;
}

export interface MonthSeriesPoint {
  key: string;
  income: number;
  expense: number;
}

function normalize(description: string): string {
  return description.trim().toLocaleLowerCase("pt-BR");
}

/** Valor mensal efetivo da despesa em um dado mês (0 se inativa). */
export function monthlyValue(expense: Expense, key: string): number {
  if (expense.kind === "income") {
    return expense.referenceMonth === key ? expense.amount : 0;
  }
  if (expense.type === "fixed" || expense.type === "once") {
    return expense.referenceMonth === key ? expense.amount : 0;
  }
  return installmentStatus(expense, key).active ? expense.amount / expense.installments! : 0;
}

/** Lançamentos fixos (despesas ou receitas) de um mês, ordenados por descrição. */
export function fixedForMonth(expenses: Expense[], key: string, kind: ExpenseKind = "expense"): Expense[] {
  return expenses
    .filter((e) => e.kind === kind && e.type === "fixed" && e.referenceMonth === key)
    .sort((a, b) => a.description.localeCompare(b.description, "pt-BR"));
}

export function installmentsForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses
    .filter(
      (e) => e.kind === "expense" && e.type === "installment" && installmentStatus(e, key).active
    )
    .sort(
      (a, b) =>
        installmentStatus(a, key).index - installmentStatus(b, key).index ||
        a.description.localeCompare(b.description, "pt-BR")
    );
}

/** Despesas únicas (pontuais) de um mês, ordenadas por descrição. */
export function onceForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses
    .filter((e) => e.kind === "expense" && e.type === "once" && e.referenceMonth === key)
    .sort((a, b) => b.amount - a.amount || a.description.localeCompare(b.description, "pt-BR"));
}

export function statsForMonth(expenses: Expense[], key: string): MonthStats {
  let fixedTotal = 0;
  let installmentTotal = 0;
  let onceTotal = 0;
  let incomeTotal = 0;
  let fixedCount = 0;
  let activeInstallments = 0;
  let onceCount = 0;
  let incomeCount = 0;
  for (const e of expenses) {
    if (e.kind === "income") {
      if (e.type === "fixed" && e.referenceMonth === key) {
        incomeTotal += e.amount;
        incomeCount += 1;
      }
    } else if (e.type === "fixed" && e.referenceMonth === key) {
      fixedTotal += e.amount;
      fixedCount += 1;
    } else if (e.type === "once" && e.referenceMonth === key) {
      onceTotal += e.amount;
      onceCount += 1;
    } else if (e.type === "installment" && installmentStatus(e, key).active) {
      installmentTotal += e.amount / e.installments!;
      activeInstallments += 1;
    }
  }
  const total = fixedTotal + installmentTotal + onceTotal;
  return {
    fixedTotal,
    installmentTotal,
    onceTotal,
    total,
    incomeTotal,
    balance: incomeTotal - total,
    fixedCount,
    activeInstallments,
    onceCount,
    incomeCount,
  };
}

/**
 * Compara lançamentos fixos (por tipo) do mês `key` com o mês anterior,
 * casando por descrição normalizada + categoria.
 */
export function compareFixed(expenses: Expense[], key: string, kind: ExpenseKind = "expense") {
  const prevKey = shiftMonth(key, -1);
  const currentEntries = fixedForMonth(expenses, key, kind);
  const prevEntries = fixedForMonth(expenses, prevKey, kind);

  const prevMap = new Map<string, number>();
  for (const e of prevEntries) {
    const k = `${normalize(e.description)}::${e.category}`;
    prevMap.set(k, (prevMap.get(k) ?? 0) + e.amount);
  }

  const usedKeys = new Set<string>();
  const rows: FixedComparison[] = [];
  for (const e of currentEntries) {
    const k = `${normalize(e.description)}::${e.category}`;
    const hasPrev = prevMap.has(k);
    const previousTotal = hasPrev ? prevMap.get(k)! : null;
    usedKeys.add(k);
    let kindOfChange: FixedComparison["kind"];
    if (!hasPrev) kindOfChange = "new";
    else if (e.amount > previousTotal!) kindOfChange = "up";
    else if (e.amount < previousTotal!) kindOfChange = "down";
    else kindOfChange = "flat";
    rows.push({ expense: e, previous: null, currentTotal: e.amount, previousTotal, kind: kindOfChange });
  }

  const absent = prevEntries.filter((e) => {
    const k = `${normalize(e.description)}::${e.category}`;
    return !usedKeys.has(k);
  });

  return { rows, absent, prevKey };
}

/** Totais por categoria das despesas de um mês, com comparação ao mês anterior. */
export function categoryTotals(expenses: Expense[], key: string): CategoryStat[] {
  const prevKey = shiftMonth(key, -1);
  const sumByCategory = (monthKey: string) => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (e.kind !== "expense") continue;
      const value = monthlyValue(e, monthKey);
      if (value <= 0) continue;
      map.set(e.category, (map.get(e.category) ?? 0) + value);
    }
    return map;
  };
  const cur = sumByCategory(key);
  const prev = sumByCategory(prevKey);
  return Array.from(cur.entries())
    .map(([cat, total]) => ({
      key: cat,
      total,
      previousTotal: prev.has(cat) ? prev.get(cat)! : null,
    }))
    .sort((a, b) => b.total - a.total);
}

/** As maiores despesas do mês pelo valor mensal efetivo. */
export function topExpenses(expenses: Expense[], key: string, n = 5): Expense[] {
  return expenses
    .filter((e) => e.kind === "expense")
    .map((e) => ({ e, value: monthlyValue(e, key) }))
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map(({ e }) => e);
}

/** Série mensal de receitas × despesas para as chaves informadas. */
export function incomeExpenseSeries(expenses: Expense[], keys: string[]): MonthSeriesPoint[] {
  return keys.map((k) => {
    const s = statsForMonth(expenses, k);
    return { key: k, income: s.incomeTotal, expense: s.total };
  });
}

/** Resumo do ano-calendário até o mês informado (inclusive). */
export function yearSummary(expenses: Expense[], monthKey: string): {
  year: number;
  months: number;
  income: number;
  expense: number;
  balance: number;
} {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  let income = 0;
  let expense = 0;
  for (let m = 1; m <= month; m += 1) {
    const k = `${year}-${String(m).padStart(2, "0")}`;
    const s = statsForMonth(expenses, k);
    income += s.incomeTotal;
    expense += s.total;
  }
  return { year, months: month, income, expense, balance: income - expense };
}

/** Totais mensais de despesas de uma lista de chaves de mês. */
export function monthlyTotals(expenses: Expense[], keys: string[]): number[] {
  return keys.map((k) => statsForMonth(expenses, k).total);
}

/** Médias dos últimos N meses encerrando no mês informado. */
export function monthlyAverages(expenses: Expense[], monthKey: string, n = 6): {
  income: number;
  expense: number;
  balance: number;
} {
  let income = 0;
  let expense = 0;
  for (let i = 0; i < n; i += 1) {
    const s = statsForMonth(expenses, shiftMonth(monthKey, -i));
    income += s.incomeTotal;
    expense += s.total;
  }
  return {
    income: income / n,
    expense: expense / n,
    balance: (income - expense) / n,
  };
}

/** Valor total restante de uma despesa parcelada a partir do mês informado. */
export function remainingAmount(expense: Expense, key: string): number {
  const st = installmentStatus(expense, key);
  if (!st.active || expense.kind !== "expense" || expense.type !== "installment") return 0;
  const perMonth = expense.amount / expense.installments!;
  return perMonth * st.remainingMonths;
}
