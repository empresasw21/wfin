"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabaseConfigured } from "@/lib/supabase";

export type AuthGateStatus = "setup" | "loading" | "ready";

/**
 * Protege páginas: redireciona para /login quando não autenticado
 * e informa se o app está configurado/carregando/pronto.
 */
export function useRequireAuth(): AuthGateStatus {
  const router = useRouter();
  const { user, authLoading } = useApp();

  useEffect(() => {
    if (!supabaseConfigured) return;
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (!supabaseConfigured) return "setup";
  if (authLoading || !user) return "loading";
  return "ready";
}
