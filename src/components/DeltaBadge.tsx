import { deltaBadge } from "@/lib/format";

const STYLES: Record<string, string> = {
  up: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  down: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  flat: "bg-zinc-100 text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400",
  new: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
};

/** Para receitas/saldo, aumento é bom e redução é ruim — inverte as cores. */
const INVERTED_STYLES: Record<string, string> = {
  up: STYLES.down,
  down: STYLES.up,
  flat: STYLES.flat,
  new: STYLES.new,
};

const ARROWS: Record<string, string> = { up: "▲", down: "▼", flat: "=", new: "★" };

export default function DeltaBadge({
  current,
  previous,
  size = "sm",
  invert = false,
}: {
  current: number;
  previous: number | null;
  size?: "sm" | "xs";
  /** true quando aumentar é algo bom (receitas, saldo). */
  invert?: boolean;
}) {
  const info = deltaBadge(current, previous);
  if (!info) return null;
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const styles = invert ? INVERTED_STYLES[info.kind] : STYLES[info.kind];
  return (
    <span
      title={info.title}
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${pad} ${styles}`}
    >
      <span aria-hidden className="text-[8px] leading-none">{ARROWS[info.kind]}</span>
      {info.text}
    </span>
  );
}
