export default function SetupNotice() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
            W
          </span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">WFin</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configuração necessária</p>
          </div>
        </div>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
          O app precisa das credenciais do Supabase para funcionar. Siga os passos:
        </p>
        <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <strong className="text-zinc-900 dark:text-zinc-100">1.</strong> Crie um projeto gratuito em{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-600 underline underline-offset-2 dark:text-emerald-400"
            >
              supabase.com
            </a>
          </li>
          <li className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <strong className="text-zinc-900 dark:text-zinc-100">2.</strong> No SQL Editor, execute o script{" "}
            <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-700">supabase/schema.sql</code>{" "}
            deste repositório
          </li>
          <li className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <strong className="text-zinc-900 dark:text-zinc-100">3.</strong> Defina as variáveis de ambiente:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-2.5 text-[11px] leading-relaxed text-emerald-300">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
            </pre>
          </li>
          <li className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <strong className="text-zinc-900 dark:text-zinc-100">4.</strong> Reinicie o servidor (local) ou faça um novo deploy (Vercel)
          </li>
        </ol>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Instruções completas no README do projeto.
        </p>
      </div>
    </main>
  );
}
