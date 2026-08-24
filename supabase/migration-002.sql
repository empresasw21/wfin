-- ============================================================
-- WFin — Migração 002: receitas/saldo + categorias personalizadas
-- Execute no SQL Editor do Supabase (projetos já existentes).
-- ============================================================

-- 1) Coluna kind: distingue despesa de receita na tabela expenses.
--    Receitas são lançamentos mensais: type='fixed' com reference_month.
alter table public.expenses add column if not exists kind text not null default 'expense';

alter table public.expenses drop constraint if exists expenses_kind_check;
alter table public.expenses add constraint expenses_kind_check
  check (kind in ('expense', 'income'));

-- Receita não pode ter parcelamento nem mês de início de parcelas.
alter table public.expenses drop constraint if exists expenses_income_shape_check;
alter table public.expenses add constraint expenses_income_shape_check
  check (
    kind <> 'income'
    or (type = 'fixed' and installments is null and start_month is null)
  );

create index if not exists expenses_user_kind_idx on public.expenses (user_id, kind);

-- 2) Categorias personalizadas por usuário.
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

alter table public.categories enable row level security;

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

create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort_order);
