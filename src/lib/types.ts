export type ExpenseType = "fixed" | "installment";

export interface Expense {
  id: string;
  userId: string;
  description: string;
  category: string;
  type: ExpenseType;
  /** Fixa: valor mensal. Parcelada: valor total da compra. */
  amount: number;
  installments: number | null;
  /** Primeiro mês da parcela ("YYYY-MM"). Apenas parceladas. */
  startMonth: string | null;
  /** Mês de referência do lançamento fixo ("YYYY-MM"). Apenas fixas. */
  referenceMonth: string | null;
  createdAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "userId" | "createdAt">;

export interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "moradia", label: "Moradia", emoji: "🏠" },
  { id: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "saude", label: "Saúde", emoji: "💊" },
  { id: "educacao", label: "Educação", emoji: "📚" },
  { id: "lazer", label: "Lazer", emoji: "🎮" },
  { id: "assinaturas", label: "Assinaturas", emoji: "🔁" },
  { id: "outros", label: "Outros", emoji: "📦" },
];

export function categoryOf(id: string): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
