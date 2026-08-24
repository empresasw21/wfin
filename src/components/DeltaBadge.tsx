import { deltaBadge } from "@/lib/format";

const STYLES: Record<string, string> = {
  up: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  down: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  flat: "bg-zinc-100 text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400",
  new: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
};

const ARROWS: Record<string, string> = { up: "▲", down: "▼", flat: "=", new: "★" };

export default function DeltaBadge({
  current,
  previous,
  size = "sm",
}: {
  current: number;
  previous: number | null;
  size?: "sm" | "xs";
}) {
  const info = deltaBadge(current, previous);
  if (!info) return null;
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      title={info.title}
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${pad} ${STYLES[info.kind]}`}
    >
      <span aria-hidden className="text-[8px] leading-none">{ARROWS[info.kind]}</span>
      {info.text}
    </span>
  );
}
