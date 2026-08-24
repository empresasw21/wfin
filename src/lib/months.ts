import type { Expense } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Chave do mês a partir de uma data local ("YYYY-MM"). */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

/** Desloca a chave de mês em N meses (aceita negativos). */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** "2026-08" -> "ago. 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const text = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
  return text.replace(".", "");
}

/** "2026-08" -> "ago" */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

/** Compara duas chaves de mês: -1, 0 ou 1. */
export function compareMonthKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Quantidade de meses entre `from` e `to` (positivo se to > from). */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

/** "YYYY-MM-DD" -> "YYYY-MM" */
export function dayToMonthKey(day: string): string {
  return day.slice(0, 7);
}

/** "YYYY-MM" -> "YYYY-MM-01" (formato date do Postgres) */
export function monthKeyToDay(key: string): string {
  return `${key}-01`;
}

/** Informações de uma despesa parcelada em um dado mês. */
export function installmentStatus(
  expense: Expense,
  key: string
): { active: boolean; index: number; remainingMonths: number; endKey: string } {
  const start = expense.startMonth ?? "";
  const n = expense.installments ?? 1;
  const offset = monthsBetween(start, key);
  const active = offset >= 0 && offset < n;
  return {
    active,
    index: offset + 1,
    remainingMonths: Math.max(0, n - Math.max(offset, 0)),
    endKey: shiftMonth(start, n - 1),
  };
}
