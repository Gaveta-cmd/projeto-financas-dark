-- =====================================================================
-- Adiciona household_id e scope em goals e spending_limits.
-- Metas com scope='household' são visíveis a todos do grupo.
-- =====================================================================

alter table public.goals
  add column if not exists household_id uuid references public.households(id),
  add column if not exists scope        text not null default 'personal'
    check (scope in ('personal','household'));

alter table public.spending_limits
  add column if not exists household_id uuid references public.households(id);

-- Atualizar policy SELECT de goals para incluir metas do household
drop policy if exists "goals_select_own"       on public.goals;
drop policy if exists "goals_select_household" on public.goals;

create policy "goals_select_household"
  on public.goals for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      scope = 'household'
      and household_id is not null
      and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );
