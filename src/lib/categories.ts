import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY, type Category, type CategoryDef } from "./types";

export function categoryOf(categories: Category[], key: string): CategoryDef {
  const found = categories.find((c) => c.key === key);
  if (found) return { id: found.key, label: found.label, emoji: found.emoji };
  const legacy = DEFAULT_CATEGORIES.find((c) => c.key === key);
  if (legacy) return { id: legacy.key, label: legacy.label, emoji: legacy.emoji };
  return { id: FALLBACK_CATEGORY.key, label: FALLBACK_CATEGORY.label, emoji: FALLBACK_CATEGORY.emoji };
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

export function nextSortOrder(categories: Category[]): number {
  return categories.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 10;
}

export const EMOJI_PRESETS = [
  "🏠", "🍽️", "🚗", "💊", "📚", "🎮", "🔁", "📦",
  "🛒", "✈️", "🐶", "💡", "💧", "📱", "👕", "🎁",
  "💰", "🏦", "⚽", "🎬", "🎓", "🧾", "🚿", "☕",
];
