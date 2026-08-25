-- Migration 004 — despesas únicas (pontuais)
-- Adiciona o tipo 'once' a public.expenses: valor cheio em um único mês,
-- sem parcelas e sem start_month.
-- Execute no SQL Editor do Supabase (idempotente).

alter table public.expenses drop constraint if exists expenses_type_check;
alter table public.expenses add constraint expenses_type_check
  check (type in ('fixed', 'installment', 'once'));

alter table public.expenses drop constraint if exists expenses_once_shape_check;
alter table public.expenses add constraint expenses_once_shape_check
  check (
    type <> 'once'
    or (installments is null and start_month is null)
  );

comment on table public.expenses is
  'Lançamentos do usuário. kind=''expense'' + type=''fixed'': valor mensal em reference_month. kind=''expense'' + type=''installment'': compra total (amount) em installments parcelas a partir de start_month. kind=''expense'' + type=''once'': gasto pontual (valor cheio) apenas em reference_month. kind=''income'': receita mensal em reference_month.';
