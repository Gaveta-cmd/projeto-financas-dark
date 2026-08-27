-- =====================================================================
-- Adiciona household_id em profiles para lookup rápido sem JOIN.
-- =====================================================================

alter table public.profiles
  add column if not exists household_id uuid references public.households(id);

create index if not exists idx_profiles_household_id on public.profiles(household_id);

-- Ampliar a policy SELECT de profiles para permitir que membros do mesmo
-- household vejam o perfil uns dos outros (necessário para exibir nicknames/avatars)
drop policy if exists "profiles_select_own"       on public.profiles;
drop policy if exists "profiles_select_household" on public.profiles;

create policy "profiles_select_household"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or (
      household_id is not null
      and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );
