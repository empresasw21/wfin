"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabaseConfigured } from "@/lib/supabase";
import AuthForm from "@/components/AuthForm";
import SetupNotice from "@/components/SetupNotice";

export default function LoginPage() {
  const router = useRouter();
  const { user, authLoading } = useApp();

  useEffect(() => {
    if (!authLoading && user && supabaseConfigured) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  if (!supabaseConfigured) return <SetupNotice />;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <AuthForm />
    </main>
  );
}
