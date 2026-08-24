-- WFin — schema do Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  category text not null default 'outros',
  type text not null check (type in ('fixed', 'installment')),
  amount numeric(12, 2) not null check (amount > 0),
  installments int check (installments is null or installments between 2 and 120),
  start_month date check (start_month is null or start_month = date_trunc('month', start_month)),
  reference_month date check (reference_month is null or reference_month = date_trunc('month', reference_month)),
  created_at timestamptz not null default now()
);

comment on table public.expenses is
  'Despesas do usuário. type=''fixed'': valor mensal em reference_month. type=''installment'': compra total (amount) dividida em installments parcelas a partir de start_month.';

-- Segurança: cada usuário só acessa as próprias despesas.
alter table public.expenses enable row level security;

drop policy if exists "Usuário seleciona as próprias despesas" on public.expenses;
create policy "Usuário seleciona as próprias despesas"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere as próprias despesas" on public.expenses;
create policy "Usuário insere as próprias despesas"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias despesas" on public.expenses;
create policy "Usuário atualiza as próprias despesas"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário exclui as próprias despesas" on public.expenses;
create policy "Usuário exclui as próprias despesas"
  on public.expenses for delete
  using (auth.uid() = user_id);

create index if not exists expenses_user_reference_month_idx
  on public.expenses (user_id, reference_month);

create index if not exists expenses_user_start_month_idx
  on public.expenses (user_id, start_month);
