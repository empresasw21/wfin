-- WFin — migration 008: Grupos de despesas
-- Execute no SQL Editor do Supabase.

-- ============================================================
-- Tabela de grupos de despesas
-- ============================================================
create table if not exists public.expense_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  emoji text not null default '📁',
  reference_month date check (reference_month is null or reference_month = date_trunc('month', reference_month)),
  created_at timestamptz not null default now()
);

comment on table public.expense_groups is
  'Grupos de despesas do usuário. Permite agrupar lançamentos (ex.: Reforma, Viagem) com valor total calculado pela soma das sub-despesas.';

-- ============================================================
-- Coluna group_id na tabela de despesas
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'group_id'
  ) then
    alter table public.expenses add column group_id uuid references public.expense_groups(id) on delete set null;
  end if;
end $$;

-- ============================================================
-- Segurança: RLS
-- ============================================================
alter table public.expense_groups enable row level security;

drop policy if exists "Usuário seleciona os próprios grupos" on public.expense_groups;
create policy "Usuário seleciona os próprios grupos"
  on public.expense_groups for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere os próprios grupos" on public.expense_groups;
create policy "Usuário insere os próprios grupos"
  on public.expense_groups for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza os próprios grupos" on public.expense_groups;
create policy "Usuário atualiza os próprios grupos"
  on public.expense_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário exclui os próprios grupos" on public.expense_groups;
create policy "Usuário exclui os próprios grupos"
  on public.expense_groups for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists expense_groups_user_month_idx
  on public.expense_groups (user_id, reference_month);

create index if not exists expenses_group_id_idx
  on public.expenses (group_id);
