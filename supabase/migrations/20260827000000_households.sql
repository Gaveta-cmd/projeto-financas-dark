-- =====================================================================
-- Grupos familiares (households)
-- Cada household agrupa N usuários da mesma casa.
-- invite_code é gerado automaticamente e usado para entrada de novos membros.
-- =====================================================================

create table if not exists public.households (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  invite_code text        unique not null default upper(substr(md5(random()::text), 1, 8)),
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'households_name_len_chk') then
    alter table public.households
      add constraint households_name_len_chk check (length(name) between 1 and 80);
  end if;
end $$;

alter table public.households enable row level security;

drop policy if exists "households_select_member"  on public.households;
drop policy if exists "households_insert_auth"    on public.households;
drop policy if exists "households_update_creator" on public.households;

-- Qualquer membro do household pode ler
create policy "households_select_member"
  on public.households for select
  to authenticated
  using (
    id in (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );

-- Qualquer autenticado pode criar um household
create policy "households_insert_auth"
  on public.households for insert
  to authenticated
  with check (auth.uid() is not null);

-- Apenas o criador pode atualizar nome
create policy "households_update_creator"
  on public.households for update
  to authenticated
  using (created_by = auth.uid());
