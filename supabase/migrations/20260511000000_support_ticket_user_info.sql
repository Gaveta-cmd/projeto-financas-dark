-- =====================================================================
-- Adiciona email e nome do usuário em `support_tickets` para que o webhook
-- de notificação receba essa informação direto no payload, sem precisar
-- fazer lookup em auth.users / profiles.
--
-- Segurança:
--   - Os campos são preenchidos por trigger BEFORE INSERT, então valores
--     que o client tente enviar são SOBRESCRITOS pela verdade do auth.uid().
--   - Trigger é SECURITY DEFINER porque auth.users não é legível por
--     authenticated.
--   - search_path travado para evitar hijack de objeto.
-- =====================================================================

alter table public.support_tickets
  add column if not exists user_email text,
  add column if not exists user_name  text;

create or replace function public.fill_support_ticket_user_info()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  select u.email,
         coalesce(p.full_name, u.raw_user_meta_data->>'full_name')
    into new.user_email, new.user_name
    from auth.users u
    left join public.profiles p on p.id = u.id
   where u.id = new.user_id;

  return new;
end;
$$;

drop trigger if exists support_tickets_fill_user_info on public.support_tickets;
create trigger support_tickets_fill_user_info
  before insert on public.support_tickets
  for each row
  execute function public.fill_support_ticket_user_info();

-- Backfill dos tickets antigos (que existem hoje sem essa info).
update public.support_tickets t
   set user_email = u.email,
       user_name  = coalesce(p.full_name, u.raw_user_meta_data->>'full_name')
  from auth.users u
  left join public.profiles p on p.id = u.id
 where t.user_id = u.id
   and t.user_email is null;
