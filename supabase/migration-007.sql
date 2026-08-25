-- Migration 007 — Flag carry_forward nas despesas
-- Indica se a despesa fixa/receita deve manter o valor nos meses seguintes.
-- Execute no SQL Editor do Supabase (idempotente).

alter table public.expenses
  add column if not exists carry_forward boolean not null default false;
