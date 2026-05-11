-- =====================================================================
-- Adiciona a coluna `bank_source` em transactions, installments e
-- subscriptions, marcando registros que vieram do seed automático
-- ao "conectar" um banco simulado.
--
-- Por que existe:
--   - Linhas criadas manualmente pelo usuário ficam com bank_source = NULL.
--   - Linhas geradas pelo seed levam bank_source = '<bank_id>' (ex.: 'nubank').
--   - Ao desconectar o banco, a gente apaga só as linhas com aquele
--     bank_source — limpeza precisa, sem chance de apagar dados manuais.
--
-- Idempotente (usa `add column if not exists` e `create index if not exists`).
-- =====================================================================

alter table public.transactions
  add column if not exists bank_source text;

create index if not exists transactions_user_bank_source_idx
  on public.transactions (user_id, bank_source);

alter table public.installments
  add column if not exists bank_source text;

create index if not exists installments_user_bank_source_idx
  on public.installments (user_id, bank_source);

alter table public.subscriptions
  add column if not exists bank_source text;

create index if not exists subscriptions_user_bank_source_idx
  on public.subscriptions (user_id, bank_source);
