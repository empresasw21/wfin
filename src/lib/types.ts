export type ExpenseType = "fixed" | "installment";
export type ExpenseKind = "expense" | "income";

export interface Expense {
  id: string;
  userId: string;
  description: string;
  category: string;
  /** Despesa ou receita. Receitas são sempre lançamentos mensais (type fixed). */
  kind: ExpenseKind;
  type: ExpenseType;
  /**
   * Despesa fixa: valor mensal. Parcelada: valor total da compra.
   * Receita: valor recebido no mês.
   */
  amount: number;
  installments: number | null;
  /** Primeiro mês da parcela ("YYYY-MM"). Apenas despesas parceladas. */
  startMonth: string | null;
  /** Mês de referência do lançamento fixo/receita ("YYYY-MM"). */
  referenceMonth: string | null;
  createdAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "userId" | "createdAt">;

export interface Category {
  userId: string;
  key: string;
  label: string;
  emoji: string;
  sortOrder: number;
  createdAt?: string;
}

export type CategoryInput = Omit<Category, "userId" | "createdAt">;

export interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
}

/** Categorias semeadas automaticamente no primeiro acesso do usuário. */
export const DEFAULT_CATEGORIES: Array<CategoryDef & { key: string }> = [
  { id: "moradia", key: "moradia", label: "Moradia", emoji: "🏠" },
  { id: "alimentacao", key: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { id: "transporte", key: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "saude", key: "saude", label: "Saúde", emoji: "💊" },
  { id: "educacao", key: "educacao", label: "Educação", emoji: "📚" },
  { id: "lazer", key: "lazer", label: "Lazer", emoji: "🎮" },
  { id: "assinaturas", key: "assinaturas", label: "Assinaturas", emoji: "🔁" },
  { id: "outros", key: "outros", label: "Outros", emoji: "📦" },
];

export const FALLBACK_CATEGORY: CategoryDef & { key: string } = {
  id: "outros",
  key: "outros",
  label: "Outros",
  emoji: "📦",
};
