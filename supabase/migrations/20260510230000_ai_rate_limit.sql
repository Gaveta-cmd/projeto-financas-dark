-- =====================================================================
-- Rate limit por usuário para a Edge Function `support-ai`.
--
-- Mantém uma linha por usuário com janelas de contagem:
--   - count_min  : requests no minuto atual
--   - count_day  : requests no dia atual (UTC)
--
-- A função `consume_support_ai_quota` é SECURITY DEFINER e devolve
-- `allowed=false` quando o limite estourar — assim a Edge Function
-- não precisa receber service_role e mesmo assim conta na conta certa.
-- =====================================================================

create table if not exists public.support_ai_usage (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  window_min_start timestamptz not null default date_trunc('minute', now()),
  window_day_start date         not null default (now() at time zone 'UTC')::date,
  count_min        integer      not null default 0,
  count_day        integer      not null default 0,
  updated_at       timestamptz  not null default now()
);

alter table public.support_ai_usage enable row level security;

-- Não exponha a tabela diretamente: o usuário só interage via RPC.
drop policy if exists "support_ai_usage_no_access" on public.support_ai_usage;
create policy "support_ai_usage_no_access"
  on public.support_ai_usage
  for all
  to authenticated
  using (false)
  with check (false);

-- RPC consume — devolve allowed boolean + counters. Limites: 12/min, 200/dia.
create or replace function public.consume_support_ai_quota(
  p_max_per_minute integer default 12,
  p_max_per_day    integer default 200
)
returns table (allowed boolean, remaining_min integer, remaining_day integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid          uuid := auth.uid();
  now_min      timestamptz := date_trunc('minute', now());
  today_utc    date := (now() at time zone 'UTC')::date;
  cur_min_cnt  integer;
  cur_day_cnt  integer;
begin
  if uid is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  insert into public.support_ai_usage as u (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  -- Reset de janelas + incremento atômico.
  update public.support_ai_usage
     set count_min  = case when window_min_start = now_min   then count_min + 1 else 1 end,
         count_day  = case when window_day_start = today_utc then count_day + 1 else 1 end,
         window_min_start = now_min,
         window_day_start = today_utc,
         updated_at       = now()
   where user_id = uid
   returning count_min, count_day
   into cur_min_cnt, cur_day_cnt;

  -- Estourou? Retorna allowed=false e devolve a contagem (sem decrementar
  -- para não permitir burst-bypass com requests paralelas).
  if cur_min_cnt > p_max_per_minute or cur_day_cnt > p_max_per_day then
    return query select false,
                        greatest(p_max_per_minute - cur_min_cnt, 0),
                        greatest(p_max_per_day    - cur_day_cnt, 0);
    return;
  end if;

  return query select true,
                      p_max_per_minute - cur_min_cnt,
                      p_max_per_day    - cur_day_cnt;
end;
$$;

revoke all on function public.consume_support_ai_quota(integer, integer) from public;
revoke all on function public.consume_support_ai_quota(integer, integer) from anon;
grant  execute on function public.consume_support_ai_quota(integer, integer) to authenticated;
