-- Migration 005 — lançamentos com valor zerado (semeadura automática)
-- Permite amount = 0: o app semeia fixas/receitas do mês anterior como
-- placeholders zerados para o usuário informar o valor do mês.
-- Execute no SQL Editor do Supabase (idempotente).

alter table public.expenses drop constraint if exists expenses_amount_check;
alter table public.expenses add constraint expenses_amount_check
  check (amount >= 0);
