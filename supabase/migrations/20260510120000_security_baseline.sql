-- =====================================================================
-- Baseline de segurança: RLS, policies e defaults para tabelas sensíveis.
--
-- Aplica:
--   1. Habilita RLS em `profiles` e `support_tickets`.
--   2. Policies que restringem cada usuário ao próprio registro.
--   3. `support_tickets.user_id` passa a ter DEFAULT auth.uid() e NOT NULL,
--      para que o client não precise (nem possa) escolher de quem é o ticket.
--   4. CHECKs simples de tamanho para evitar lixo em campos abertos.
--
-- Como rodar:
--   - Via Supabase CLI:  supabase db push
--   - Ou cole o conteúdo no SQL Editor (Dashboard → SQL).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_delete_own"  on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Nenhuma policy de DELETE: profile só é apagado pelo RPC delete_user
-- (que roda como SECURITY DEFINER e ignora RLS).

-- CHECK leve para evitar campos absurdamente grandes
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_whatsapp_len_chk'
  ) then
    alter table public.profiles
      add constraint profiles_whatsapp_len_chk
      check (whatsapp is null or length(whatsapp) <= 20);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_full_name_len_chk'
  ) then
    alter table public.profiles
      add constraint profiles_full_name_len_chk
      check (full_name is null or length(full_name) <= 120);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) support_tickets
-- ---------------------------------------------------------------------
alter table public.support_tickets enable row level security;

-- user_id agora vem do servidor — o client não precisa mandar.
alter table public.support_tickets
  alter column user_id set default auth.uid(),
  alter column user_id set not null;

drop policy if exists "tickets_insert_own"  on public.support_tickets;
drop policy if exists "tickets_select_own"  on public.support_tickets;
drop policy if exists "tickets_update_own"  on public.support_tickets;
drop policy if exists "tickets_delete_own"  on public.support_tickets;

create policy "tickets_insert_own"
  on public.support_tickets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "tickets_select_own"
  on public.support_tickets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Sem UPDATE/DELETE para o usuário comum: tickets são imutáveis do lado do cliente.
-- Equipe interna acessa via service role (bypassa RLS).

-- CHECKs de tamanho para evitar abuso
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'support_tickets_subject_len_chk'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_subject_len_chk
      check (length(subject) between 1 and 100);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'support_tickets_description_len_chk'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_description_len_chk
      check (length(description) between 10 and 2000);
  end if;
end $$;
