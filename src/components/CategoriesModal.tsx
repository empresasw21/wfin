"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { EMOJI_PRESETS, INCOME_EMOJI_PRESETS } from "@/lib/categories";
import type { Category, ExpenseKind } from "@/lib/types";
import { CloseIcon, PencilIcon, PlusIcon, TrashIcon } from "./icons";

export default function CategoriesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { categories, expenses, addCategory, updateCategory, deleteCategory } = useApp();
  const [newKind, setNewKind] = useState<ExpenseKind>("expense");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNewKind("expense");
      setNewLabel("");
      setNewEmoji("📦");
      setEditingKey(null);
      setConfirmDeleteKey(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const presets = newKind === "income" ? INCOME_EMOJI_PRESETS : EMOJI_PRESETS;
  const sorted = [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "pt-BR")
  );
  const groups: Array<{ kind: ExpenseKind; title: string }> = [
    { kind: "expense", title: "Despesas" },
    { kind: "income", title: "Receitas" },
  ];

  function usageCount(key: string): number {
    return expenses.filter((e) => e.category === key).length;
  }

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      await addCategory({ label: newLabel, emoji: newEmoji, kind: newKind });
      setNewLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(cat: Category) {
    setEditingKey(cat.key);
    setEditLabel(cat.label);
    setEditEmoji(cat.emoji);
    setConfirmDeleteKey(null);
  }

  async function handleSaveEdit() {
    if (!editingKey) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(editingKey, { label: editLabel, emoji: editEmoji });
      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar categoria.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(key: string, kind: ExpenseKind) {
    if (confirmDeleteKey !== key) {
      setConfirmDeleteKey(key);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(key, kind);
      setConfirmDeleteKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir categoria.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciar categorias"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-xl dark:bg-zinc-900 sm:rounded-3xl sm:pb-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Categorias</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Nova categoria</p>
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {(
              [
                ["expense", "Despesa"],
                ["income", "Receita"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setNewKind(value);
                  setNewEmoji(value === "income" ? "💰" : "📦");
                }}
                className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  newKind === value
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {presets.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setNewEmoji(emoji)}
                aria-label={`Escolher emoji ${emoji}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors ${
                  newEmoji === emoji
                    ? "bg-emerald-100 ring-1 ring-emerald-500 dark:bg-emerald-500/20"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={
                newKind === "income" ? "Ex.: Aluguel recebido" : "Ex.: Academia"
              }
              maxLength={30}
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !newLabel.trim()}
              aria-label="Adicionar categoria"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-50 ${
                newKind === "income"
                  ? "bg-teal-500 hover:bg-teal-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {groups.map(({ kind, title }) => {
          const groupCats = sorted.filter((c) => c.kind === kind);
          if (groupCats.length === 0) return null;
          return (
            <section key={kind} className="mb-4">
              <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {title}
              </h3>
              <ul className="space-y-1.5">
                {groupCats.map((cat) => (
                  <li
                    key={cat.key}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {editingKey === cat.key ? (
                      <div>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {(cat.kind === "income" ? INCOME_EMOJI_PRESETS : EMOJI_PRESETS).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setEditEmoji(emoji)}
                              aria-label={`Escolher emoji ${emoji}`}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                                editEmoji === emoji
                                  ? "bg-emerald-100 ring-1 ring-emerald-500 dark:bg-emerald-500/20"
                                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            maxLength={30}
                            className={`${inputClass} !py-2`}
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={busy || !editLabel.trim()}
                            className="shrink-0 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="shrink-0 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="text-lg">{cat.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {cat.label}
                          </span>
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                            {usageCount(cat.key)} lançamento{usageCount(cat.key) === 1 ? "" : "s"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          aria-label={`Editar categoria ${cat.label}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {!cat.key.startsWith("outros") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.key, cat.kind)}
                            aria-label={
                              confirmDeleteKey === cat.key
                                ? "Confirmar exclusão da categoria"
                                : `Excluir categoria ${cat.label}`
                            }
                            title={
                              confirmDeleteKey === cat.key
                                ? "Toque novamente para excluir (lançamentos vão para Outros)"
                                : "Excluir categoria"
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                              confirmDeleteKey === cat.key
                                ? "bg-red-600 text-white"
                                : "text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            }`}
                          >
                            {confirmDeleteKey === cat.key ? (
                              <span className="px-0.5 text-[9px] font-bold leading-tight">Certeza?</span>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Ao excluir uma categoria, seus lançamentos do mesmo tipo são movidos para{" "}
          <strong>Outros</strong>. As categorias &quot;Outros&quot; não podem ser excluídas.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
