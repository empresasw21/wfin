-- Migration 006 — Controle de pagamento por mês
-- Tabela payments: rastreia quais despesas foram pagas em cada mês.
-- Execute no SQL Editor do Supabase (idempotente).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expense_id uuid not null references public.expenses (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)),
  paid boolean not null default true,
  paid_at timestamptz not null default now(),
  unique (user_id, expense_id, month)
);

comment on table public.payments is
  'Registros de pagamento de despesas por mês. Cada linha indica se uma despesa foi paga em um mês específico.';

alter table public.payments enable row level security;

drop policy if exists "Usuário seleciona os próprios pagamentos" on public.payments;
create policy "Usuário seleciona os próprios pagamentos"
  on public.payments for select using (auth.uid() = user_id);

drop policy if exists "Usuário insere os próprios pagamentos" on public.payments;
create policy "Usuário insere os próprios pagamentos"
  on public.payments for insert with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza os próprios pagamentos" on public.payments;
create policy "Usuário atualiza os próprios pagamentos"
  on public.payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário exclui os próprios pagamentos" on public.payments;
create policy "Usuário exclui os próprios pagamentos"
  on public.payments for delete using (auth.uid() = user_id);

create index if not exists payments_user_expense_idx
  on public.payments (user_id, expense_id);

create index if not exists payments_user_month_idx
  on public.payments (user_id, month);
