-- =====================================================================
-- Tabela `cards`: cartões de crédito acompanhados pelo usuário.
--
-- Segurança:
--   - RLS habilitado: cada usuário só enxerga / cria / atualiza / apaga os
--     próprios cartões.
--   - user_id tem DEFAULT auth.uid() + NOT NULL — o client não escolhe dono.
--   - CHECKs em name, last_digits (4 dígitos), limit/used (>= 0,
--     used <= limit), due_date e closing_date (1..31), color (#RRGGBB).
--   - Índice (user_id, due_date) para listar e calcular vencimentos.
-- =====================================================================

create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users(id) on delete cascade,
  name          text not null,
  last_digits   text not null,
  limit_amount  numeric(14, 2) not null,
  used_amount   numeric(14, 2) not null default 0,
  due_date      integer not null,
  closing_date  integer not null,
  color         text not null default '#ef233c',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cards_name_len_chk') then
    alter table public.cards
      add constraint cards_name_len_chk
      check (length(name) between 1 and 60);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_last_digits_chk') then
    alter table public.cards
      add constraint cards_last_digits_chk
      check (last_digits ~ '^[0-9]{4}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_limit_positive_chk') then
    alter table public.cards
      add constraint cards_limit_positive_chk
      check (limit_amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_used_range_chk') then
    alter table public.cards
      add constraint cards_used_range_chk
      check (used_amount >= 0 and used_amount <= limit_amount);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_due_date_range_chk') then
    alter table public.cards
      add constraint cards_due_date_range_chk
      check (due_date between 1 and 31);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_closing_date_range_chk') then
    alter table public.cards
      add constraint cards_closing_date_range_chk
      check (closing_date between 1 and 31);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cards_color_format_chk') then
    alter table public.cards
      add constraint cards_color_format_chk
      check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists cards_user_due_idx
  on public.cards (user_id, due_date asc);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.cards enable row level security;

drop policy if exists "cards_select_own" on public.cards;
drop policy if exists "cards_insert_own" on public.cards;
drop policy if exists "cards_update_own" on public.cards;
drop policy if exists "cards_delete_own" on public.cards;

create policy "cards_select_own"
  on public.cards
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "cards_insert_own"
  on public.cards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "cards_update_own"
  on public.cards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cards_delete_own"
  on public.cards
  for delete
  to authenticated
  using (auth.uid() = user_id);
