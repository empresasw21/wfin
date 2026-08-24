const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function fmtBRL(value: number): string {
  return brl.format(value);
}

export function fmtPct(pct: number): string {
  const abs = Math.abs(pct);
  const text = abs.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${text}%`;
}

export function fmtSignedBRL(delta: number): string {
  const abs = Math.abs(delta).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${abs}`;
}

/** Aceita "1.234,56" e "1234.56". Retorna NaN se inválido. */
export function parseAmount(input: string): number {
  const cleaned = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return NaN;
  return Number.parseFloat(cleaned);
}

export interface DeltaBadgeInfo {
  kind: "up" | "down" | "flat" | "new";
  /** Texto curto exibido no selo, ex.: "+R$ 25,00 · +12,5%" */
  text: string;
  title: string;
}

/**
 * Compara o valor atual com o anterior.
 * Para despesas: aumento é ruim (vermelho), redução é bom (verde).
 */
export function deltaBadge(current: number, previous: number | null): DeltaBadgeInfo | null {
  if (previous === null) {
    return { kind: "new", text: "novo este mês", title: "Sem registro no mês anterior" };
  }
  if (previous === 0) {
    return current > 0
      ? { kind: "up", text: `+${fmtBRL(current)}`, title: "Mês anterior sem valor" }
      : { kind: "flat", text: "sem alteração", title: "Valores iguais" };
  }
  const delta = current - previous;
  const pct = (delta / previous) * 100;
  if (Math.abs(delta) < 0.005) {
    return { kind: "flat", text: "sem alteração", title: "Valores iguais ao mês anterior" };
  }
  const kind = delta > 0 ? "up" : "down";
  const rounded = Math.abs(pct) < 0.05 ? null : fmtPct(pct);
  const text = rounded ? `${fmtSignedBRL(delta)} · ${rounded}` : fmtSignedBRL(delta);
  const title =
    kind === "up"
      ? `Aumentou ${fmtSignedBRL(delta)} (${fmtPct(pct)}) em relação ao mês anterior`
      : `Reduziu ${fmtBRL(Math.abs(delta))} (${fmtPct(pct)}) em relação ao mês anterior`;
  return { kind, text, title };
}
