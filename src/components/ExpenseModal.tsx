"use client";

import { useEffect, useState, type FormEvent } from "react";
import { fmtBRL, parseAmount } from "@/lib/format";
import { currentMonthKey, monthLabel } from "@/lib/months";
import { CATEGORIES, type Expense, type ExpenseInput, type ExpenseType } from "@/lib/types";
import { CloseIcon, TrashIcon } from "./icons";

const QUICK_INSTALLMENTS = [2, 3, 6, 10, 12, 24];

export default function ExpenseModal({
  open,
  expense,
  defaultMonth,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  expense: Expense | null;
  defaultMonth: string;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [type, setType] = useState<ExpenseType>("fixed");
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [installments, setInstallments] = useState(12);
  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [category, setCategory] = useState("outros");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);
    setBusy(false);
    if (expense) {
      setType(expense.type);
      setDescription(expense.description);
      setAmountText(String(expense.amount).replace(".", ","));
      setInstallments(expense.installments ?? 12);
      setStartMonth(expense.startMonth ?? expense.referenceMonth ?? defaultMonth);
      setCategory(expense.category);
    } else {
      setType("fixed");
      setDescription("");
      setAmountText("");
      setInstallments(12);
      setStartMonth(defaultMonth);
      setCategory("outros");
    }
  }, [open, expense, defaultMonth]);

  if (!open) return null;

  const amount = parseAmount(amountText);
  const perMonth =
    type === "installment" && Number.isFinite(amount) && amount > 0 && installments >= 2
      ? amount / installments
      : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!(Number.isFinite(amount) && amount > 0)) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }
    if (type === "installment" && installments < 2) {
      setError("O parcelamento precisa de pelo menos 2 parcelas.");
      return;
    }
    setBusy(true);
    setError(null);
    onSubmit({
      description: description.trim(),
      category,
      type,
      amount,
      installments: type === "installment" ? installments : null,
      startMonth: type === "installment" ? startMonth || currentMonthKey() : null,
      referenceMonth: type === "fixed" ? startMonth || currentMonthKey() : null,
    })
      .then(onClose)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
        setBusy(false);
      });
  }

  async function handleDelete() {
    if (!expense) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    await onDelete(expense.id).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
      setBusy(false);
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={expense ? "Editar despesa" : "Nova despesa"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-xl dark:bg-zinc-900 sm:rounded-3xl sm:pb-5"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {expense ? "Editar despesa" : "Nova despesa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {(
              [
                ["fixed", "Fixa mensal"],
                ["installment", "Parcelada"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  type === value
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Field label="Descrição">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Aluguel, Notebook, Netflix..."
              maxLength={60}
              className={inputClass}
              autoFocus={!expense}
            />
          </Field>

          <Field
            label={type === "fixed" ? "Valor mensal" : "Valor total da compra"}
            hint={
              perMonth !== null
                ? `= ${fmtBRL(perMonth)} por mês em ${installments}x`
                : undefined
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-zinc-400">
                R$
              </span>
              <input
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className={`${inputClass} pl-10 tabular-nums`}
              />
            </div>
          </Field>

          {type === "installment" && (
            <Field label="Número de parcelas">
              <input
                value={installments}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setInstallments(Number.isNaN(n) ? 0 : n);
                }}
                inputMode="numeric"
                min={2}
                max={120}
                className={`${inputClass} tabular-nums`}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_INSTALLMENTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInstallments(n)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      installments === n
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label={type === "fixed" ? "Mês de referência" : "Mês da 1ª parcela"}>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              max="2099-12"
              className={inputClass}
            />
            {startMonth && (
              <p className="mt-1.5 text-xs text-zinc-400">{monthLabel(startMonth)}</p>
            )}
          </Field>

          <Field label="Categoria">
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  title={c.label}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors ${
                    category === c.id
                      ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {c.emoji}
                  </span>
                  <span
                    className={`w-full truncate text-center text-[9px] ${
                      category === c.id
                        ? "font-semibold text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {expense && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-60 ${
                  confirmDelete
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                }`}
                title={confirmDelete ? "Toque novamente para confirmar" : "Excluir despesa"}
              >
                {confirmDelete ? (
                  <span className="px-1 text-[10px] font-bold leading-tight">Certeza?</span>
                ) : (
                  <TrashIcon className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-11 flex-1 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs font-medium text-emerald-600 dark:text-emerald-400">{hint}</span>}
    </label>
  );
}
