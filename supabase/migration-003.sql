-- ============================================================
-- WFin — Migração 003: categorias específicas por tipo
-- (despesas × receitas). Execute no SQL Editor do Supabase.
-- ============================================================

-- 1) Coluna kind nas categorias: 'expense' (despesas) ou 'income' (receitas).
--    Categorias existentes tornam-se 'expense' automaticamente (default).
alter table public.categories add column if not exists kind text not null default 'expense';

alter table public.categories drop constraint if exists categories_kind_check;
alter table public.categories add constraint categories_kind_check
  check (kind in ('expense', 'income'));

create index if not exists categories_user_kind_idx
  on public.categories (user_id, kind);

-- 2) As categorias padrão de receita (salário, investimentos, vendas, renda extra,
--    presentes e outros) são inseridas automaticamente pelo app no próximo login.
