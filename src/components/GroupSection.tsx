"use client";

import { useCallback, useState } from "react";
import { fmtBRL } from "@/lib/format";
import { monthlyValue } from "@/lib/calc";
import { categoryOf } from "@/lib/categories";
import { installmentStatus } from "@/lib/months";
import { useApp } from "@/context/AppContext";
import type { Expense, ExpenseGroup } from "@/lib/types";
import { SectionHeader } from "./SummaryCards";
import { ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon } from "./icons";
import PaymentToggle from "./PaymentToggle";

function groupTotal(expenses: Expense[], group: ExpenseGroup, monthKey: string): number {
  return expenses
    .filter((e) => e.groupId === group.id && e.kind === "expense")
    .reduce((acc, e) => acc + monthlyValue(e, monthKey), 0);
}

function GroupItem({
  group,
  expenses,
  monthKey,
  expanded,
  onToggle,
}: {
  group: ExpenseGroup;
  expenses: Expense[];
  monthKey: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { categories, openEditExpense, openNewExpense, updateGroup, deleteGroup } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editEmoji, setEditEmoji] = useState(group.emoji);
  const [busy, setBusy] = useState(false);

  const total = groupTotal(expenses, group, monthKey);
  const children = expenses
    .filter((e) => e.groupId === group.id && e.kind === "expense")
    .sort((a, b) => a.description.localeCompare(b.description, "pt-BR"));

  const handleSaveEdit = useCallback(async () => {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      await updateGroup(group.id, { name: editName.trim(), emoji: editEmoji });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }, [group.id, editName, editEmoji, updateGroup]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await deleteGroup(group.id);
    } finally {
      setBusy(false);
    }
  }, [group.id, confirmDelete, deleteGroup]);

  const handleAddChild = useCallback(() => {
    openNewExpense();
  }, [openNewExpense]);

  return (
    <li className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Cabeçalho do grupo */}
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400 transition-transform dark:text-zinc-500"
          aria-label={expanded ? "Recolher grupo" : "Expandir grupo"}
        >
          <ChevronRightIcon
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={editEmoji}
              onChange={(e) => setEditEmoji(e.target.value)}
              className="w-10 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800"
              maxLength={2}
            />
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            />
            <button
              onClick={handleSaveEdit}
              disabled={busy || !editName.trim()}
              className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
            >
              OK
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditName(group.name);
                setEditEmoji(group.emoji);
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-base dark:bg-amber-500/10">
              {group.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {group.name}
                </span>
                <PencilIcon className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
              </span>
              <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                {children.length} item{children.length !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {fmtBRL(total)}
            </span>
          </>
        )}
      </div>

      {/* Itens expandidos */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {children.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Nenhuma despesa neste grupo.
              </p>
              <button
                onClick={handleAddChild}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Adicionar despesa
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {children.map((e) => {
                const cat = categoryOf(categories, e.category, "expense");
                const isInstallment = e.type === "installment";
                const perMonth = isInstallment ? e.amount / e.installments! : null;
                const st = isInstallment ? installmentStatus(e, monthKey) : null;

                return (
                  <li key={e.id}>
                    <div className="flex items-center gap-3 pl-9 pr-3 py-1.5">
                      <PaymentToggle expenseId={e.id} monthKey={monthKey} />
                      <button
                        onClick={() => openEditExpense(e)}
                        className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm dark:bg-zinc-800"
                        >
                          {cat.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {e.description}
                            </span>
                            <PencilIcon className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                            {isInstallment && st
                              ? `Parcela ${st.index} de ${e.installments}`
                              : e.type === "once"
                                ? "Única"
                                : "Fixa mensal"}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                          {perMonth !== null ? fmtBRL(perMonth) : fmtBRL(e.amount)}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Ações do grupo */}
          <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <button
              onClick={handleAddChild}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Adicionar despesa
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <button
              onClick={() => {
                setEditing(true);
                setEditName(group.name);
                setEditEmoji(group.emoji);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Editar
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <button
              onClick={handleDelete}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                confirmDelete
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
              }`}
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {confirmDelete ? "Confirmar exclusão?" : "Excluir grupo"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function GroupSection({
  expenses,
  monthKey,
}: {
  expenses: Expense[];
  monthKey: string;
}) {
  const { groups, addGroup } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [busy, setBusy] = useState(false);

  const monthGroups = groups.filter((g) => !g.referenceMonth || g.referenceMonth === monthKey);
  const total = monthGroups.reduce((acc, g) => acc + groupTotal(expenses, g, monthKey), 0);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await addGroup({ name: newName.trim(), emoji: newEmoji, referenceMonth: monthKey });
      setNewName("");
      setNewEmoji("📁");
      setShowNewGroup(false);
    } finally {
      setBusy(false);
    }
  }, [newName, newEmoji, monthKey, addGroup]);

  if (monthGroups.length === 0 && !showNewGroup) {
    return (
      <section aria-label="Grupos de despesas">
        <SectionHeader
          title="Grupos"
          right={
            <button
              onClick={() => setShowNewGroup(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Criar grupo
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section aria-label="Grupos de despesas">
      <SectionHeader
        title={`Grupos · ${fmtBRL(total)}`}
        right={
          <button
            onClick={() => setShowNewGroup((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Novo grupo
          </button>
        }
      />

      {showNewGroup && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/5">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="w-10 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800"
            maxLength={2}
            placeholder="📁"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do grupo (ex.: Reforma)"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={busy || !newName.trim()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {busy ? "Salvando..." : "Criar"}
          </button>
          <button
            onClick={() => {
              setShowNewGroup(false);
              setNewName("");
              setNewEmoji("📁");
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {monthGroups.map((g) => (
          <GroupItem
            key={g.id}
            group={g}
            expenses={expenses}
            monthKey={monthKey}
            expanded={expandedId === g.id}
            onToggle={() => setExpandedId((prev) => (prev === g.id ? null : g.id))}
          />
        ))}
      </ul>
    </section>
  );
}
