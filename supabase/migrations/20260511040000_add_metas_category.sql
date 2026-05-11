-- =====================================================================
-- Adiciona a categoria `metas` em `transactions.category`.
--
-- Contexto:
--   - Aportes feitos pelo usuário em Metas Financeiras (botão
--     "Adicionar valor" da tela de Metas) viram transações reais com
--     categoria `metas`. Isso integra o saldo, gráficos de categoria,
--     lista de transações e o widget de metas da Visão Geral.
--   - A coluna `category` tem um CHECK constraint criado em
--     20260510210000_transactions.sql. Aqui dropamos esse check e
--     recriamos incluindo `metas` na lista permitida.
--
-- É idempotente: pode rodar várias vezes sem efeito colateral.
-- =====================================================================

alter table public.transactions
  drop constraint if exists transactions_category_chk;

alter table public.transactions
  add constraint transactions_category_chk
  check (category in (
    'alimentacao', 'transporte', 'lazer',
    'moradia',     'saude',      'outros',
    'metas'
  ));
