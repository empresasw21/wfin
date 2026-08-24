import {
  defaultCategoriesFor,
  fallbackCategoryFor,
  type Category,
  type CategoryDef,
  type ExpenseKind,
} from "./types";

/**
 * Resolve a categoria exibida para uma chave.
 * - Prefere correspondência exata de chave + tipo;
 * - Chaves compartilhadas (ex.: personalizadas) são aceitas entre tipos;
 * - Cai no padrão do próprio tipo e, por fim, no fallback ("Outros") do tipo.
 */
export function categoryOf(
  categories: Category[],
  key: string,
  kind: ExpenseKind = "expense"
): CategoryDef & { key: string } {
  const exact = categories.find((c) => c.key === key && c.kind === kind);
  if (exact) return { id: exact.key, key: exact.key, label: exact.label, emoji: exact.emoji };

  const shared = categories.find((c) => c.key === key);
  if (shared && key !== "outros" && key !== "outros-receita") {
    return { id: shared.key, key: shared.key, label: shared.label, emoji: shared.emoji };
  }

  const legacy = defaultCategoriesFor(kind).find((c) => c.key === key);
  if (legacy) return { id: legacy.key, key: legacy.key, label: legacy.label, emoji: legacy.emoji };

  const fb = fallbackCategoryFor(kind);
  return { id: fb.key, key: fb.key, label: fb.label, emoji: fb.emoji };
}

export function slugify(label: string): string {
  const base = label
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `cat-${Date.now().toString(36)}`;
}

export function uniqueKey(base: string, existingKeys: Set<string>): string {
  if (!existingKeys.has(base)) return base;
  let n = 2;
  while (existingKeys.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function nextSortOrder(categories: Category[], kind: ExpenseKind): number {
  return categories.reduce(
    (max, c) => (c.kind === kind ? Math.max(max, c.sortOrder) : max),
    0
  ) + 10;
}

export const EMOJI_PRESETS = [
  "🏠", "🍽️", "🚗", "💊", "📚", "🎮", "🔁", "📦",
  "🛒", "✈️", "🐶", "💡", "💧", "📱", "👕", "🎁",
  "💰", "🏦", "⚽", "🎬", "🎓", "🧾", "🚿", "☕",
];

export const INCOME_EMOJI_PRESETS = [
  "💼", "📈", "🛍️", "💡", "🎁", "💰", "🏦", "🏠",
  "💻", "📊", "🎯", "🤝", "🪙", "💳", "📄", "✨",
];
