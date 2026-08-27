-- =====================================================================
-- Membros do grupo familiar
-- Liga usuários a um household com renda mensal e apelido.
-- =====================================================================

create table if not exists public.household_members (
  id             uuid        primary key default gen_random_uuid(),
  household_id   uuid        not null references public.households(id) on delete cascade,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  nickname       text,
  monthly_income numeric(12,2) not null default 0 check (monthly_income >= 0),
  role           text        not null default 'member' check (role in ('admin','member')),
  joined_at      timestamptz default now(),
  unique(household_id, user_id)
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'hm_nickname_len_chk') then
    alter table public.household_members
      add constraint hm_nickname_len_chk check (nickname is null or length(nickname) <= 40);
  end if;
end $$;

create index if not exists idx_hm_user_id       on public.household_members(user_id);
create index if not exists idx_hm_household_id  on public.household_members(household_id);

alter table public.household_members enable row level security;

drop policy if exists "hm_select_same_household" on public.household_members;
drop policy if exists "hm_insert_self"           on public.household_members;
drop policy if exists "hm_update_self"           on public.household_members;

-- Membros do mesmo household se enxergam
create policy "hm_select_same_household"
  on public.household_members for select
  to authenticated
  using (
    household_id in (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );

-- Usuário insere apenas a si mesmo
create policy "hm_insert_self"
  on public.household_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- Usuário atualiza apenas seu próprio registro
create policy "hm_update_self"
  on public.household_members for update
  to authenticated
  using (user_id = auth.uid());
