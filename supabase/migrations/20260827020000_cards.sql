-- =====================================================================
-- Cartões de débito/crédito dos membros
-- type 'hybrid' = cartão que funciona como débito e crédito (ex: Nubank).
-- Todos do household enxergam todos os cartões (para a aba Cartões).
-- Só o dono pode criar/editar/deletar seus cartões.
-- =====================================================================

create table if not exists public.cards (
  id           uuid        primary key default gen_random_uuid(),
  household_id uuid        not null references public.households(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  type         text        not null check (type in ('credit','debit','hybrid')),
  bank         text,
  color        text        not null default '#6366f1',
  credit_limit numeric(12,2) check (credit_limit is null or credit_limit > 0),
  created_at   timestamptz default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cards_name_len_chk') then
    alter table public.cards
      add constraint cards_name_len_chk check (length(name) between 1 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cards_color_fmt_chk') then
    alter table public.cards
      add constraint cards_color_fmt_chk check (color ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

create index if not exists idx_cards_user_id      on public.cards(user_id);
create index if not exists idx_cards_household_id on public.cards(household_id);

alter table public.cards enable row level security;

drop policy if exists "cards_select_household" on public.cards;
drop policy if exists "cards_insert_owner"     on public.cards;
drop policy if exists "cards_update_owner"     on public.cards;
drop policy if exists "cards_delete_owner"     on public.cards;

-- Todos do household enxergam todos os cartões
create policy "cards_select_household"
  on public.cards for select
  to authenticated
  using (
    household_id in (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );

create policy "cards_insert_owner"
  on public.cards for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "cards_update_owner"
  on public.cards for update
  to authenticated
  using (user_id = auth.uid());

create policy "cards_delete_owner"
  on public.cards for delete
  to authenticated
  using (user_id = auth.uid());
