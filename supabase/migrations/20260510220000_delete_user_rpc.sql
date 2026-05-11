-- =====================================================================
-- RPC `delete_user`: apaga a própria conta do usuário autenticado.
--
-- Segurança:
--   - SECURITY DEFINER + STABLE/VOLATILE marcado corretamente.
--   - Search_path explicito para evitar hijack de objeto.
--   - GRANT só para `authenticated`. `anon` NÃO pode chamar.
--   - Usa SEMPRE auth.uid() — nunca aceita um id como parâmetro.
--     Isso impede que um usuário X execute delete_user e apague Y.
--   - As tabelas com FK para auth.users(id) ON DELETE CASCADE
--     (profiles, transactions, support_tickets, etc) são limpas
--     automaticamente.
-- =====================================================================

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  -- Remove o usuário do schema auth. As FKs com ON DELETE CASCADE
  -- cuidam das tabelas filhas (profiles, transactions, support_tickets…).
  delete from auth.users where id = uid;
end;
$$;

-- Tira permissão de qualquer outro role e libera só para authenticated.
revoke all on function public.delete_user() from public;
revoke all on function public.delete_user() from anon;
grant  execute on function public.delete_user() to authenticated;
