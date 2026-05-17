-- =====================================================================
-- Tabela `user_onboarding`: respostas do questionário pós-cadastro.
--
-- Segurança:
--   - RLS habilitado: cada usuário só acessa o próprio registro.
--   - user_id UNIQUE — no máximo um registro por usuário (upsert seguro).
--   - CHECKs em monthly_salary (positivo) e financial_goal (tamanho).
-- =====================================================================

create table if not exists public.user_onboarding (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid()
                         references auth.users(id) on delete cascade,
  monthly_salary       numeric(14, 2),
  financial_goal       text,
  preferred_categories text[],
  completed_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_onboarding_salary_positive_chk') then
    alter table public.user_onboarding
      add constraint user_onboarding_salary_positive_chk
      check (monthly_salary is null or monthly_salary > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_onboarding_goal_len_chk') then
    alter table public.user_onboarding
      add constraint user_onboarding_goal_len_chk
      check (financial_goal is null or length(financial_goal) <= 500);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índice único — base do upsert onConflict: 'user_id'
-- ---------------------------------------------------------------------
create unique index if not exists user_onboarding_user_idx
  on public.user_onboarding (user_id);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.user_onboarding enable row level security;

drop policy if exists "user_onboarding_select_own" on public.user_onboarding;
drop policy if exists "user_onboarding_insert_own" on public.user_onboarding;
drop policy if exists "user_onboarding_update_own" on public.user_onboarding;

create policy "user_onboarding_select_own"
  on public.user_onboarding
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_onboarding_insert_own"
  on public.user_onboarding
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_onboarding_update_own"
  on public.user_onboarding
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
