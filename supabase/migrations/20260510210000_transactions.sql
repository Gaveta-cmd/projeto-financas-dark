-- =====================================================================
-- Tabela `transactions` para cadastro manual de receitas/despesas.
--
-- Garantias de segurança:
--   - RLS habilitado: cada usuário só enxerga / cria / apaga as próprias
--     transações.
--   - `user_id` tem DEFAULT auth.uid() e NOT NULL — o client não escolhe
--     o dono do registro.
--   - CHECKs em type, category, amount, title.
--   - Índice composto (user_id, date desc) para listar rápido.
--
-- Como rodar:
--   supabase db push
--   (ou cole no SQL Editor do Dashboard).
-- =====================================================================

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  title       text not null,
  amount      numeric(14, 2) not null,
  category    text not null,
  type        text not null,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_title_len_chk') then
    alter table public.transactions
      add constraint transactions_title_len_chk
      check (length(title) between 1 and 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_amount_positive_chk') then
    alter table public.transactions
      add constraint transactions_amount_positive_chk
      check (amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_type_chk') then
    alter table public.transactions
      add constraint transactions_type_chk
      check (type in ('income', 'expense'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_category_chk') then
    alter table public.transactions
      add constraint transactions_category_chk
      check (category in (
        'alimentacao', 'transporte', 'lazer',
        'moradia',     'saude',      'outros'
      ));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc, created_at desc);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;

create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
