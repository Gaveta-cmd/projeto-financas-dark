-- =====================================================================
-- Tabela `subscriptions`: assinaturas recorrentes cadastradas pelo usuário
-- (Netflix, Spotify, academia, etc).
--
-- Segurança:
--   - RLS habilitado: cada usuário só enxerga / cria / atualiza / apaga as
--     próprias assinaturas.
--   - user_id tem DEFAULT auth.uid() + NOT NULL — o client não escolhe dono.
--   - CHECKs em name, amount, billing_cycle, category, color.
--   - Índice (user_id, next_billing_date asc) para listar e calcular
--     "próximas a vencer" sem fullscan.
-- =====================================================================

create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  name              text not null,
  amount            numeric(14, 2) not null,
  billing_cycle     text not null,
  category          text not null,
  color             text not null default '#ef233c',
  next_billing_date date not null,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_name_len_chk') then
    alter table public.subscriptions
      add constraint subscriptions_name_len_chk
      check (length(name) between 1 and 80);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_amount_positive_chk') then
    alter table public.subscriptions
      add constraint subscriptions_amount_positive_chk
      check (amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_billing_cycle_chk') then
    alter table public.subscriptions
      add constraint subscriptions_billing_cycle_chk
      check (billing_cycle in ('monthly', 'yearly'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_category_chk') then
    alter table public.subscriptions
      add constraint subscriptions_category_chk
      check (category in (
        'entretenimento', 'saude', 'produtividade', 'educacao', 'outros'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'subscriptions_color_format_chk') then
    alter table public.subscriptions
      add constraint subscriptions_color_format_chk
      check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists subscriptions_user_next_idx
  on public.subscriptions (user_id, next_billing_date asc);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
drop policy if exists "subscriptions_update_own" on public.subscriptions;
drop policy if exists "subscriptions_delete_own" on public.subscriptions;

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "subscriptions_insert_own"
  on public.subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "subscriptions_update_own"
  on public.subscriptions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subscriptions_delete_own"
  on public.subscriptions
  for delete
  to authenticated
  using (auth.uid() = user_id);
