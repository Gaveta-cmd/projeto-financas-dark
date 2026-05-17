-- =====================================================================
-- Tabela `spending_limits`: tetos mensais de gasto por categoria.
--
-- Segurança:
--   - RLS habilitado: cada usuário só enxerga / altera os próprios limites.
--   - user_id tem DEFAULT auth.uid() + NOT NULL.
--   - Unique em (user_id, category) — upsert garante um limite por categoria.
--   - CHECK em monthly_limit (positivo) e category (valores válidos).
-- =====================================================================

create table if not exists public.spending_limits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users(id) on delete cascade,
  category      text not null,
  monthly_limit numeric(14, 2) not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'spending_limits_amount_positive_chk') then
    alter table public.spending_limits
      add constraint spending_limits_amount_positive_chk
      check (monthly_limit > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'spending_limits_category_chk') then
    alter table public.spending_limits
      add constraint spending_limits_category_chk
      check (category in (
        'alimentacao', 'transporte', 'lazer',
        'moradia',     'saude',      'outros',
        'entretenimento', 'produtividade', 'metas'
      ));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índice único (user_id, category) — base do upsert onConflict
-- ---------------------------------------------------------------------
create unique index if not exists spending_limits_user_category_idx
  on public.spending_limits (user_id, category);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.spending_limits enable row level security;

drop policy if exists "spending_limits_select_own" on public.spending_limits;
drop policy if exists "spending_limits_insert_own" on public.spending_limits;
drop policy if exists "spending_limits_update_own" on public.spending_limits;
drop policy if exists "spending_limits_delete_own" on public.spending_limits;

create policy "spending_limits_select_own"
  on public.spending_limits
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "spending_limits_insert_own"
  on public.spending_limits
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "spending_limits_update_own"
  on public.spending_limits
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "spending_limits_delete_own"
  on public.spending_limits
  for delete
  to authenticated
  using (auth.uid() = user_id);
