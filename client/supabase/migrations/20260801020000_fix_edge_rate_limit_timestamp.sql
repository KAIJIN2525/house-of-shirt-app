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
  v_now timestamptz := clock_timestamp();
  v_window interval;
begin
  if nullif(trim(p_key_hash), '') is null or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  v_window := make_interval(secs => p_window_seconds);
  perform pg_advisory_xact_lock(hashtextextended(p_key_hash, 0));

  select * into current_row
  from public.edge_rate_limits
  where key_hash = p_key_hash
  for update;

  if not found or current_row.window_started_at + v_window <= v_now then
    insert into public.edge_rate_limits (key_hash, window_started_at, request_count, updated_at)
    values (p_key_hash, v_now, 1, v_now)
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
      greatest(1, ceil(extract(epoch from (current_row.window_started_at + v_window - v_now)))::integer);
    return;
  end if;

  update public.edge_rate_limits
  set request_count = request_count + 1,
      updated_at = v_now
  where key_hash = p_key_hash;

  return query select true, greatest(0, p_limit - current_row.request_count - 1), 0;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, integer, integer) to service_role;
