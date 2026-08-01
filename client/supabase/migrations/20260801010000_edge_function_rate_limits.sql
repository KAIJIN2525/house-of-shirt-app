create table if not exists public.edge_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.edge_rate_limits enable row level security;
revoke all on table public.edge_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.edge_rate_limits to service_role;

create or replace function public.consume_edge_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.edge_rate_limits%rowtype;
  current_time timestamptz := clock_timestamp();
  window_interval interval;
begin
  if nullif(trim(p_key_hash), '') is null or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  window_interval := make_interval(secs => p_window_seconds);
  perform pg_advisory_xact_lock(hashtextextended(p_key_hash, 0));

  select * into current_row
  from public.edge_rate_limits
  where key_hash = p_key_hash
  for update;

  if not found or current_row.window_started_at + window_interval <= current_time then
    insert into public.edge_rate_limits (key_hash, window_started_at, request_count, updated_at)
    values (p_key_hash, current_time, 1, current_time)
    on conflict (key_hash) do update
      set window_started_at = excluded.window_started_at,
          request_count = 1,
          updated_at = excluded.updated_at;
    return query select true, p_limit - 1, 0;
    return;
  end if;

  if current_row.request_count >= p_limit then
    return query select
      false,
      0,
      greatest(1, ceil(extract(epoch from (current_row.window_started_at + window_interval - current_time)))::integer);
    return;
  end if;

  update public.edge_rate_limits
  set request_count = request_count + 1,
      updated_at = current_time
  where key_hash = p_key_hash;

  return query select true, greatest(0, p_limit - current_row.request_count - 1), 0;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, integer, integer) to service_role;

comment on table public.edge_rate_limits is 'Server-only fixed-window counters shared by Supabase Edge Function instances.';
comment on function public.consume_edge_rate_limit(text, integer, integer) is 'Atomically consumes one request from a server-controlled rate-limit bucket.';
