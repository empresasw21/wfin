"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { categoryToDbRow, toCategory, toDbRow, toExpense, toPayment, toPaymentDbRow } from "@/lib/db";
import { fixedForMonth } from "@/lib/calc";
import { shiftMonth } from "@/lib/months";
import { nextSortOrder, slugify, uniqueKey } from "@/lib/categories";
import {
  defaultCategoriesFor,
  fallbackCategoryFor,
  type Category,
  type CategoryInput,
  type Expense,
  type ExpenseInput,
  type ExpenseKind,
  type Payment,
} from "@/lib/types";
import dynamic from "next/dynamic";

const ExpenseModal = dynamic(() => import("@/components/ExpenseModal"), { ssr: false });
const CategoriesModal = dynamic(() => import("@/components/CategoriesModal"), { ssr: false });

interface AppState {
  user: User | null;
  authLoading: boolean;
  expenses: Expense[];
  payments: Payment[];
  dataLoading: boolean;
  categories: Category[];
  error: string | null;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  copyFromPreviousMonth: (targetKey: string, kind: ExpenseKind) => Promise<number>;
  addCategory: (input: Omit<CategoryInput, "key" | "sortOrder">) => Promise<void>;
  updateCategory: (key: string, input: Pick<CategoryInput, "label" | "emoji">) => Promise<void>;
  deleteCategory: (key: string, kind: ExpenseKind) => Promise<void>;
  togglePayment: (expenseId: string, monthKey: string, paid: boolean) => Promise<void>;
  isPaid: (expenseId: string, monthKey: string) => boolean;
  signOut: () => Promise<void>;
  // Diálogos globais
  dialogMonth: string;
  setDialogMonth: (key: string) => void;
  openNewExpense: () => void;
  openEditExpense: (expense: Expense) => void;
  closeExpenseDialog: () => void;
  expenseDialogOpen: boolean;
  editingExpense: Expense | null;
  openCategories: () => void;
  closeCategories: () => void;
  categoriesOpen: boolean;
}

const AppContext = createContext<AppState | null>(null);

/** Erros do PostgREST chegam como objeto simples { message, code, details, hint }. */
interface PgErrorShape {
  message?: unknown;
  code?: unknown;
}

function pgMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const { message, code } = err as PgErrorShape;
  const msg = typeof message === "string" ? message : "";
  const c = typeof code === "string" ? code : "";

  if (c === "PGRST204" || c === "42703" || /could not find the .* column/i.test(msg)) {
    return "O banco de dados está desatualizado para esta versão do app. Execute os arquivos supabase/migration-*.sql pendentes (002 a 004) no SQL Editor do Supabase e tente novamente.";
  }
  if (c === "42P01" || /does not exist/i.test(msg)) {
    return "Tabela ausente no banco de dados. Execute supabase/schema.sql no SQL Editor do Supabase.";
  }
  if (/schema cache/i.test(msg)) {
    return "O Supabase está recarregando o esquema. Aguarde alguns segundos e tente novamente.";
  }
  if (c === "42501") {
    return "Permissão negada pelo banco. Saia da conta, entre novamente e tente salvar.";
  }
  if (c === "23514" || c === "23503" || /violates .* constraint|invalid input syntax/i.test(msg)) {
    return "Dados inválidos para este lançamento. Verifique valor, parcelas e mês selecionado.";
  }
  if (c === "23505" || /duplicate key/i.test(msg)) {
    return "Este lançamento já existe.";
  }
  if (c === "23502" || /null value/i.test(msg)) {
    return "Faltam dados obrigatórios neste lançamento. Verifique descrição, valor e mês.";
  }
  return msg || null;
}

function messageOf(err: unknown): string {
  const pg = pgMessage(err);
  if (pg) return pg;
  if (typeof err === "string" && err.trim()) return err;
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

/** Meses/tipos já semeados automaticamente (por usuário) — evita recriar o que foi excluído. */
const SEED_STORE_KEY = "wfin-seeded-months";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const seededRef = useRef<string | null>(null);
  const autoSeedRef = useRef<Set<string>>(new Set());

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [dialogMonth, setDialogMonth] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session) {
        setExpenses([]);
        setPayments([]);
        setCategories([]);
        userIdRef.current = null;
        seededRef.current = null;
        autoSeedRef.current = new Set();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || userIdRef.current === user.id) return;
    userIdRef.current = user.id;
    const supabase = getSupabase();
    setDataLoading(true);
    setError(null);
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(messageOf(err));
        else setExpenses((data ?? []).map(toExpense));
        setDataLoading(false);
      });

    supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data, error: err }) => {
        if (!err) setPayments((data ?? []).map(toPayment));
      });

    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .then(async ({ data, error: err }) => {
        if (err) return;
        let list = (data ?? []).map(toCategory);
        // Seed idempotente: garante os padrões de cada tipo que estiver faltando
        // (usuários novos recebem tudo; quem já usava recebe só as de receita).
        const missingKinds = (["expense", "income"] as const).filter(
          (k) => !list.some((c) => c.kind === k)
        );
        if (missingKinds.length > 0 && seededRef.current !== user.id) {
          seededRef.current = user.id;
          const rows = missingKinds.flatMap((kind) =>
            defaultCategoriesFor(kind)
              .filter((c) => !list.some((existing) => existing.key === c.key))
              .map((c, i) =>
                categoryToDbRow({
                  userId: user.id,
                  key: c.key,
                  label: c.label,
                  emoji: c.emoji,
                  kind,
                  sortOrder: (kind === "expense" ? 10 : 100) + i * 10,
                })
              )
          );
          if (rows.length > 0) {
            const { data: inserted, error: insertErr } = await supabase
              .from("categories")
              .insert(rows)
              .select();
            if (!insertErr && inserted) list = [...list, ...inserted.map(toCategory)];
          }
        }
        setCategories(list);
      });
  }, [user]);

  /**
   * Semeadura automática de fixas/receitas zeradas: ao abrir um mês ainda
   * vazio daquele tipo, replica os lançamentos do mês anterior com amount 0
   * para o usuário preencher. Marca cada (usuário, mês, tipo) uma única vez
   * (ref + localStorage) — exclusões manuais são respeitadas depois.
   */
  useEffect(() => {
    if (!supabaseConfigured || !user || dataLoading || !dialogMonth) return;
    const monthKey = dialogMonth;
    const supabase = getSupabase();

    const readStore = (): Set<string> => {
      try {
        return new Set<string>(JSON.parse(localStorage.getItem(SEED_STORE_KEY) ?? "[]"));
      } catch {
        return new Set<string>();
      }
    };
    const mark = (stamp: string) => {
      autoSeedRef.current.add(stamp);
      const store = readStore();
      store.add(stamp);
      try {
        localStorage.setItem(SEED_STORE_KEY, JSON.stringify([...store]));
      } catch {}
    };

    for (const kind of ["expense", "income"] as ExpenseKind[]) {
      const stamp = `${user.id}:${monthKey}:${kind}`;
      if (autoSeedRef.current.has(stamp)) continue;
      autoSeedRef.current.add(stamp);

      const prevEntries = fixedForMonth(expenses, shiftMonth(monthKey, -1), kind);
      if (prevEntries.length === 0 || fixedForMonth(expenses, monthKey, kind).length > 0) {
        // Nada a semear ou mês já possui lançamentos: nunca mais tenta este mês/tipo.
        mark(stamp);
        continue;
      }

      const rows = prevEntries.map((e) => ({
        ...toDbRow({
          id: "",
          description: e.description,
          category: e.category,
          kind,
          type: "fixed",
          amount: 0,
          installments: null,
          startMonth: null,
          referenceMonth: monthKey,
        }),
        user_id: user.id,
      }));
      mark(stamp);
      supabase
        .from("expenses")
        .insert(rows)
        .select()
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setExpenses((prev) => [...prev, ...data.map(toExpense)]);
          }
        });
    }
  }, [user, expenses, dataLoading, dialogMonth]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      // user_id é obrigatório: a política RLS (auth.uid() = user_id) rejeita inserções sem ele.
      const row = { ...toDbRow({ ...input, id: "" }), user_id: user.id };
      const { data, error: err } = await supabase.from("expenses").insert(row).select().single();
      if (err) throw new Error(messageOf(err));
      setExpenses((prev) => [...prev, toExpense(data)]);
    },
    [user]
  );

  const updateExpense = useCallback(async (id: string, input: ExpenseInput) => {
    const supabase = getSupabase();
    const row = toDbRow({ ...input, id });
    const { data, error: err } = await supabase
      .from("expenses")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (err) throw new Error(messageOf(err));
    const updated = toExpense(data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const supabase = getSupabase();
    const { error: err } = await supabase.from("expenses").delete().eq("id", id);
    if (err) throw new Error(messageOf(err));
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const copyFromPreviousMonth = useCallback(
    async (targetKey: string, kind: ExpenseKind): Promise<number> => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      const prevKey = shiftMonth(targetKey, -1);
      const prevEntries = fixedForMonth(expenses, prevKey, kind);
      const existing = new Set(
        fixedForMonth(expenses, targetKey, kind).map(
          (e) => `${e.description.trim().toLowerCase()}::${e.category}`
        )
      );
      const missing = prevEntries.filter(
        (e) => !existing.has(`${e.description.trim().toLowerCase()}::${e.category}`)
      );
      if (missing.length === 0) return 0;
      const rows = missing.map((e) => ({
        ...toDbRow({
          id: "",
          description: e.description,
          category: e.category,
          kind,
          type: "fixed",
          amount: e.amount,
          installments: null,
          startMonth: null,
          referenceMonth: targetKey,
        }),
        user_id: user.id,
      }));
      const { data, error: err } = await supabase.from("expenses").insert(rows).select();
      if (err) throw new Error(messageOf(err));
      setExpenses((prev) => [...prev, ...(data ?? []).map(toExpense)]);
      return missing.length;
    },
    [expenses, user]
  );

  const addCategory = useCallback(
    async (input: Omit<CategoryInput, "key" | "sortOrder">) => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      const label = input.label.trim();
      if (!label) throw new Error("Informe um nome para a categoria.");
      const kind: ExpenseKind = input.kind === "income" ? "income" : "expense";
      const keys = new Set(categories.map((c) => c.key));
      const key = uniqueKey(slugify(label), keys);
      const row = categoryToDbRow({
        userId: user.id,
        key,
        label,
        emoji: input.emoji || fallbackCategoryFor(kind).emoji,
        kind,
        sortOrder: nextSortOrder(categories, kind),
      });
      const { data, error: err } = await supabase.from("categories").insert(row).select().single();
      if (err) throw new Error(messageOf(err));
      setCategories((prev) => [...prev, toCategory(data)]);
    },
    [categories, user]
  );

  const updateCategory = useCallback(
    async (key: string, input: Pick<CategoryInput, "label" | "emoji">) => {
      const supabase = getSupabase();
      const label = input.label.trim();
      if (!label) throw new Error("Informe um nome para a categoria.");
      const { error: err } = await supabase
        .from("categories")
        .update({ label, emoji: input.emoji })
        .eq("key", key);
      if (err) throw new Error(messageOf(err));
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, label, emoji: input.emoji } : c))
      );
    },
    []
  );

  const deleteCategory = useCallback(
    async (key: string, kind: ExpenseKind) => {
      const supabase = getSupabase();
      const fallbackKey = fallbackCategoryFor(kind).key;
      if (key === fallbackKey || key.startsWith("outros")) {
        throw new Error('A categoria "Outros" não pode ser excluída.');
      }
      // Reatribui apenas os lançamentos do mesmo tipo.
      const { error: updErr } = await supabase
        .from("expenses")
        .update({ category: fallbackKey })
        .eq("category", key)
        .eq("kind", kind);
      if (updErr) throw new Error(messageOf(updErr));
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === key && e.kind === kind ? { ...e, category: fallbackKey } : e
        )
      );
      const { error: err } = await supabase.from("categories").delete().eq("key", key);
      if (err) throw new Error(messageOf(err));
      setCategories((prev) => prev.filter((c) => c.key !== key));
    },
    []
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const togglePayment = useCallback(
    async (expenseId: string, monthKey: string, paid: boolean) => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");

      const existing = payments.find(
        (p) => p.expenseId === expenseId && p.month === monthKey
      );

      if (existing) {
        const { error: err } = await supabase
          .from("payments")
          .update({ paid })
          .eq("id", existing.id);
        if (err) throw new Error(messageOf(err));
        setPayments((prev) =>
          prev.map((p) => (p.id === existing.id ? { ...p, paid } : p))
        );
      } else {
        const row = { ...toPaymentDbRow({ expenseId, month: monthKey, paid }), user_id: user.id };
        const { data, error: err } = await supabase
          .from("payments")
          .insert(row)
          .select()
          .single();
        if (err) throw new Error(messageOf(err));
        setPayments((prev) => [...prev, toPayment(data)]);
      }
    },
    [user, payments]
  );

  const isPaid = useCallback(
    (expenseId: string, monthKey: string) => {
      return payments.some((p) => p.expenseId === expenseId && p.month === monthKey && p.paid);
    },
    [payments]
  );

  const openNewExpense = useCallback(() => {
    setEditingExpense(null);
    setExpenseDialogOpen(true);
  }, []);

  const openEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  }, []);

  const closeExpenseDialog = useCallback(() => setExpenseDialogOpen(false), []);
  const openCategories = useCallback(() => setCategoriesOpen(true), []);
  const closeCategories = useCallback(() => setCategoriesOpen(false), []);

  const value = useMemo<AppState>(
    () => ({
      user,
      authLoading,
      expenses,
      payments,
      dataLoading,
      categories,
      error,
      addExpense,
      updateExpense,
      deleteExpense,
      copyFromPreviousMonth,
      addCategory,
      updateCategory,
      deleteCategory,
      togglePayment,
      isPaid,
      signOut,
      dialogMonth,
      setDialogMonth,
      openNewExpense,
      openEditExpense,
      closeExpenseDialog,
      expenseDialogOpen,
      editingExpense,
      openCategories,
      closeCategories,
      categoriesOpen,
    }),
    [
      user,
      authLoading,
      expenses,
      payments,
      dataLoading,
      categories,
      error,
      addExpense,
      updateExpense,
      deleteExpense,
      copyFromPreviousMonth,
      addCategory,
      updateCategory,
      deleteCategory,
      togglePayment,
      isPaid,
      signOut,
      dialogMonth,
      openNewExpense,
      openEditExpense,
      closeExpenseDialog,
      expenseDialogOpen,
      editingExpense,
      openCategories,
      closeCategories,
      categoriesOpen,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <ExpenseModal
        open={expenseDialogOpen}
        expense={editingExpense}
        defaultMonth={dialogMonth}
        onClose={closeExpenseDialog}
        onSubmit={editingExpense ? updateExpense.bind(null, editingExpense.id) : addExpense}
        onDelete={deleteExpense}
        onManageCategories={openCategories}
      />
      <CategoriesModal open={categoriesOpen} onClose={closeCategories} />
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
