export type ExpenseType = "fixed" | "installment" | "once";
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
   * Única: valor cheio do gasto pontual. Receita: valor recebido no mês.
   */
  amount: number;
  installments: number | null;
  /** Primeiro mês da parcela ("YYYY-MM"). Apenas despesas parceladas. */
  startMonth: string | null;
  /** Mês de referência do lançamento fixo/receita ("YYYY-MM"). */
  referenceMonth: string | null;
  /** Se true, a despesa fixa/receita mantém o valor ao ser semeadada nos meses seguintes. */
  carryForward: boolean;
  createdAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "userId" | "createdAt">;

export interface Payment {
  id: string;
  userId: string;
  expenseId: string;
  /** Mês de referência ("YYYY-MM"). */
  month: string;
  paid: boolean;
  paidAt: string;
}

export type PaymentInput = Omit<Payment, "id" | "userId" | "paidAt">;

export interface Category {
  userId: string;
  key: string;
  label: string;
  emoji: string;
  /** Categorias são específicas por tipo de lançamento. */
  kind: ExpenseKind;
  sortOrder: number;
  createdAt?: string;
}

export type CategoryInput = Omit<Category, "userId" | "createdAt">;

export interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
}

interface DefaultCategory extends CategoryDef {
  key: string;
  kind: ExpenseKind;
}

/** Categorias padrão de despesas, semeadas no primeiro acesso. */
export const EXPENSE_DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: "moradia", key: "moradia", label: "Moradia", emoji: "🏠", kind: "expense" },
  { id: "alimentacao", key: "alimentacao", label: "Alimentação", emoji: "🍽️", kind: "expense" },
  { id: "transporte", key: "transporte", label: "Transporte", emoji: "🚗", kind: "expense" },
  { id: "saude", key: "saude", label: "Saúde", emoji: "💊", kind: "expense" },
  { id: "educacao", key: "educacao", label: "Educação", emoji: "📚", kind: "expense" },
  { id: "lazer", key: "lazer", label: "Lazer", emoji: "🎮", kind: "expense" },
  { id: "assinaturas", key: "assinaturas", label: "Assinaturas", emoji: "🔁", kind: "expense" },
  { id: "outros", key: "outros", label: "Outros", emoji: "📦", kind: "expense" },
];

/** Categorias padrão de receitas, semeadas no primeiro acesso (e para usuários existentes). */
export const INCOME_DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: "salario", key: "salario", label: "Salário", emoji: "💼", kind: "income" },
  { id: "investimentos", key: "investimentos", label: "Investimentos", emoji: "📈", kind: "income" },
  { id: "vendas", key: "vendas", label: "Vendas", emoji: "🛍️", kind: "income" },
  { id: "renda-extra", key: "renda-extra", label: "Renda extra", emoji: "💡", kind: "income" },
  { id: "presentes", key: "presentes", label: "Presentes", emoji: "🎁", kind: "income" },
  { id: "outros-receita", key: "outros-receita", label: "Outros", emoji: "💰", kind: "income" },
];

export function defaultCategoriesFor(kind: ExpenseKind): DefaultCategory[] {
  return kind === "income" ? INCOME_DEFAULT_CATEGORIES : EXPENSE_DEFAULT_CATEGORIES;
}

export function fallbackCategoryFor(kind: ExpenseKind): CategoryDef & { key: string } {
  return kind === "income"
    ? { id: "outros-receita", key: "outros-receita", label: "Outros", emoji: "💰" }
    : { id: "outros", key: "outros", label: "Outros", emoji: "📦" };
}
