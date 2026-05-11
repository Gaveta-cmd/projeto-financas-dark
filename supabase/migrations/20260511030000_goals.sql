-- =====================================================================
-- Tabela `goals`: metas financeiras do usuário
-- (ex.: "Viagem pro Japão", "Reserva de emergência", "PlayStation 5").
--
-- Segurança:
--   - RLS habilitado: cada usuário só enxerga / cria / atualiza / apaga as
--     próprias metas.
--   - user_id tem DEFAULT auth.uid() + NOT NULL — o client não escolhe dono.
--   - CHECKs em name, target_amount, current_amount, category, color e na
--     invariante current_amount <= target_amount * 2 (deixa o usuário guardar
--     além da meta sem travar, mas evita valores absurdos).
--   - Índice (user_id, deadline asc) para listar e priorizar metas próximas.
-- =====================================================================

create table if not exists public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid()
                    references auth.users(id) on delete cascade,
  name            text not null,
  target_amount   numeric(14, 2) not null,
  current_amount  numeric(14, 2) not null default 0,
  deadline        date not null,
  category        text not null,
  color           text not null default '#ef233c',
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'goals_name_len_chk') then
    alter table public.goals
      add constraint goals_name_len_chk
      check (length(name) between 1 and 80);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_target_amount_positive_chk') then
    alter table public.goals
      add constraint goals_target_amount_positive_chk
      check (target_amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_current_amount_range_chk') then
    alter table public.goals
      add constraint goals_current_amount_range_chk
      check (current_amount >= 0 and current_amount <= target_amount * 2);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_category_chk') then
    alter table public.goals
      add constraint goals_category_chk
      check (category in (
        'viagem', 'emergencia', 'eletronico', 'veiculo', 'imovel', 'outros'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_color_format_chk') then
    alter table public.goals
      add constraint goals_color_format_chk
      check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists goals_user_deadline_idx
  on public.goals (user_id, deadline asc);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own"
  on public.goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals
  for delete
  to authenticated
  using (auth.uid() = user_id);
