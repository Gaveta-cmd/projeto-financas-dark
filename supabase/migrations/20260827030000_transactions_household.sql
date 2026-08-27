-- =====================================================================
-- Adiciona household_id e card_id em transactions.
-- A nova policy SELECT permite que membros do mesmo household vejam
-- as transações uns dos outros.
-- Backfill: preenche household_id nas transações existentes via profiles.
-- =====================================================================

alter table public.transactions
  add column if not exists household_id uuid references public.households(id),
  add column if not exists card_id      uuid references public.cards(id);

create index if not exists idx_transactions_household_date
  on public.transactions(household_id, date desc);

-- Backfill: transações existentes herdam o household do dono
update public.transactions t
set household_id = p.household_id
from public.profiles p
where t.user_id = p.id
  and t.household_id is null
  and p.household_id is not null;

-- Dropar policy SELECT antiga (só cobria user_id = auth.uid()) e criar nova
drop policy if exists "transactions_select_own"      on public.transactions;
drop policy if exists "transactions_select_household" on public.transactions;

-- Usuário vê suas próprias transações OU as de qualquer membro do seu household
create policy "transactions_select_household"
  on public.transactions for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      household_id is not null
      and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );
