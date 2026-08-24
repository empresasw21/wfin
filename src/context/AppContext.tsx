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
import { toDbRow, toExpense } from "@/lib/db";
import { fixedForMonth } from "@/lib/calc";
import { shiftMonth } from "@/lib/months";
import type { Expense, ExpenseInput } from "@/lib/types";

interface AppState {
  user: User | null;
  authLoading: boolean;
  expenses: Expense[];
  dataLoading: boolean;
  error: string | null;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  copyFixedFromPreviousMonth: (targetKey: string) => Promise<number>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

function messageOf(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

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
      if (!session) setExpenses([]);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      userIdRef.current = null;
      return;
    }
    if (userIdRef.current === user.id) return;
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
  }, [user]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      const row = toDbRow({ ...input, id: "" });
      const { data, error: err } = await supabase
        .from("expenses")
        .insert(row)
        .select()
        .single();
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

  const copyFixedFromPreviousMonth = useCallback(
    async (targetKey: string): Promise<number> => {
      const supabase = getSupabase();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");
      const prevKey = shiftMonth(targetKey, -1);
      const prevFixed = fixedForMonth(expenses, prevKey);
      const existing = new Set(
        fixedForMonth(expenses, targetKey).map((e) =>
          `${e.description.trim().toLowerCase()}::${e.category}`
        )
      );
      const missing = prevFixed.filter(
        (e) => !existing.has(`${e.description.trim().toLowerCase()}::${e.category}`)
      );
      if (missing.length === 0) return 0;
      const rows = missing.map((e) =>
        toDbRow({
          id: "",
          description: e.description,
          category: e.category,
          type: "fixed",
          amount: e.amount,
          installments: null,
          startMonth: null,
          referenceMonth: targetKey,
        })
      );
      const { data, error: err } = await supabase.from("expenses").insert(rows).select();
      if (err) throw new Error(messageOf(err));
      setExpenses((prev) => [...prev, ...(data ?? []).map(toExpense)]);
      return missing.length;
    },
    [expenses, user]
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      user,
      authLoading,
      expenses,
      dataLoading,
      error,
      addExpense,
      updateExpense,
      deleteExpense,
      copyFixedFromPreviousMonth,
      signOut,
    }),
    [
      user,
      authLoading,
      expenses,
      dataLoading,
      error,
      addExpense,
      updateExpense,
      deleteExpense,
      copyFixedFromPreviousMonth,
      signOut,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
