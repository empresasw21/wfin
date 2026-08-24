-- WFin — schema do Supabase (instalação completa)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Projetos já existentes criados antes da v2: rode também supabase/migration-002.sql
-- (os comandos abaixo são idempotentes e cobrem ambos os casos).

-- ============================================================
-- Tabela de lançamentos (despesas e receitas)
-- ============================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  category text not null default 'outros',
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  type text not null check (type in ('fixed', 'installment')),
  amount numeric(12, 2) not null check (amount > 0),
  installments int check (installments is null or installments between 2 and 120),
  start_month date check (start_month is null or start_month = date_trunc('month', start_month)),
  reference_month date check (reference_month is null or reference_month = date_trunc('month', reference_month)),
  created_at timestamptz not null default now()
);

alter table public.expenses drop constraint if exists expenses_kind_check;
alter table public.expenses add constraint expenses_kind_check
  check (kind in ('expense', 'income'));

alter table public.expenses drop constraint if exists expenses_income_shape_check;
alter table public.expenses add constraint expenses_income_shape_check
  check (
    kind <> 'income'
    or (type = 'fixed' and installments is null and start_month is null)
  );

comment on table public.expenses is
  'Lançamentos do usuário. kind=''expense'' + type=''fixed'': valor mensal em reference_month. kind=''expense'' + type=''installment'': compra total (amount) em installments parcelas a partir de start_month. kind=''income'': receita mensal em reference_month.';

-- ============================================================
-- Categorias personalizadas
-- ============================================================
create table if not exists public.categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  label text not null check (char_length(label) between 1 and 30),
  emoji text not null default '📦',
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

comment on table public.categories is
  'Categorias do usuário. expenses.category referencia categories.key. As categorias padrão são semeadas automaticamente pelo app no primeiro acesso.';

-- ============================================================
-- Segurança: cada usuário só acessa os próprios dados.
-- ============================================================
alter table public.expenses enable row level security;
alter table public.categories enable row level security;

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

drop policy if exists "Usuário seleciona as próprias categorias" on public.categories;
create policy "Usuário seleciona as próprias categorias"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere as próprias categorias" on public.categories;
create policy "Usuário insere as próprias categorias"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias categorias" on public.categories;
create policy "Usuário atualiza as próprias categorias"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário exclui as próprias categorias" on public.categories;
create policy "Usuário exclui as próprias categorias"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists expenses_user_reference_month_idx
  on public.expenses (user_id, reference_month);

create index if not exists expenses_user_start_month_idx
  on public.expenses (user_id, start_month);

create index if not exists expenses_user_kind_idx
  on public.expenses (user_id, kind);

create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort_order);
