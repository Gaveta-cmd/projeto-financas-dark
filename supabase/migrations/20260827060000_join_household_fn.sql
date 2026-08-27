-- =====================================================================
-- Função SECURITY DEFINER para entrar em um household via invite_code.
-- Roda com os privilégios do owner (ignora RLS nas tabelas internas),
-- garantindo que o usuário não possa manipular o household_id livremente.
-- =====================================================================

create or replace function public.join_household_by_code(
  code           text,
  nickname_param text,
  income_param   numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hh_id uuid;
begin
  -- Busca o household pelo código (case-insensitive)
  select id into hh_id
  from public.households
  where invite_code = upper(trim(code));

  if hh_id is null then
    raise exception 'Código de convite inválido ou expirado.';
  end if;

  -- Insere o membro (idempotente: não duplica se já for membro)
  insert into public.household_members(household_id, user_id, nickname, monthly_income, role)
  values (hh_id, auth.uid(), trim(nickname_param), income_param, 'member')
  on conflict (household_id, user_id) do update
    set nickname = excluded.nickname,
        monthly_income = excluded.monthly_income;

  -- Atualiza profiles.household_id para lookup rápido
  update public.profiles
  set household_id = hh_id
  where id = auth.uid();

  return hh_id;
end;
$$;

-- Garante que apenas usuários autenticados chamem a função
revoke all on function public.join_household_by_code(text, text, numeric) from public;
grant execute on function public.join_household_by_code(text, text, numeric) to authenticated;
