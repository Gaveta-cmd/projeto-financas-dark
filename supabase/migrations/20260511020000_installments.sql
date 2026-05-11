-- =====================================================================
-- Tabela `installments`: compras parceladas que o usuário acompanha
-- (ex.: "Geladeira em 12x").
--
-- Segurança:
--   - RLS habilitado: cada usuário só enxerga / cria / atualiza / apaga as
--     próprias parcelas.
--   - user_id tem DEFAULT auth.uid() + NOT NULL — o client não escolhe dono.
--   - CHECKs em name, total_amount, installment_amount, total_installments
--     e na invariante paid <= total.
--   - Índice (user_id, start_date asc) para listar e calcular próximas.
-- =====================================================================

create table if not exists public.installments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                        references auth.users(id) on delete cascade,
  name                text not null,
  total_amount        numeric(14, 2) not null,
  installment_amount  numeric(14, 2) not null,
  total_installments  integer not null,
  paid_installments   integer not null default 0,
  start_date          date not null,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Constraints (idempotentes)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'installments_name_len_chk') then
    alter table public.installments
      add constraint installments_name_len_chk
      check (length(name) between 1 and 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'installments_total_amount_positive_chk') then
    alter table public.installments
      add constraint installments_total_amount_positive_chk
      check (total_amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'installments_installment_amount_positive_chk') then
    alter table public.installments
      add constraint installments_installment_amount_positive_chk
      check (installment_amount > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'installments_total_count_chk') then
    alter table public.installments
      add constraint installments_total_count_chk
      check (total_installments between 1 and 360);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'installments_paid_range_chk') then
    alter table public.installments
      add constraint installments_paid_range_chk
      check (paid_installments >= 0 and paid_installments <= total_installments);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists installments_user_start_idx
  on public.installments (user_id, start_date asc);

-- ---------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------
alter table public.installments enable row level security;

drop policy if exists "installments_select_own" on public.installments;
drop policy if exists "installments_insert_own" on public.installments;
drop policy if exists "installments_update_own" on public.installments;
drop policy if exists "installments_delete_own" on public.installments;

create policy "installments_select_own"
  on public.installments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "installments_insert_own"
  on public.installments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "installments_update_own"
  on public.installments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "installments_delete_own"
  on public.installments
  for delete
  to authenticated
  using (auth.uid() = user_id);
