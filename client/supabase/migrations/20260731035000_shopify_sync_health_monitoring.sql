create table if not exists public.integration_health_incidents (
  incident_key text primary key,
  integration text not null,
  status text not null default 'active'
    check (status in ('active', 'resolved')),
  severity text not null default 'warning'
    check (severity in ('warning', 'critical')),
  title text not null,
  message text not null,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_notified_at timestamptz,
  resolved_at timestamptz
);

alter table public.integration_health_incidents enable row level security;

create policy "Admins can view integration incidents"
  on public.integration_health_incidents
  for select
  to authenticated
  using (public.current_user_is_admin());

create or replace function public.record_integration_incident(
  p_incident_key text,
  p_integration text,
  p_active boolean,
  p_severity text,
  p_title text,
  p_message text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.integration_health_incidents%rowtype;
  should_notify boolean := false;
begin
  select * into existing
  from public.integration_health_incidents
  where incident_key = p_incident_key
  for update;

  if p_active then
    if not found then
      insert into public.integration_health_incidents (
        incident_key,
        integration,
        status,
        severity,
        title,
        message,
        last_notified_at
      ) values (
        p_incident_key,
        p_integration,
        'active',
        p_severity,
        p_title,
        p_message,
        now()
      );
      return true;
    end if;

    should_notify := existing.status = 'resolved'
      or existing.last_notified_at is null
      or existing.last_notified_at < now() - interval '6 hours';

    update public.integration_health_incidents
    set
      status = 'active',
      severity = p_severity,
      title = p_title,
      message = p_message,
      occurrence_count = case
        when existing.status = 'resolved' then 1
        else occurrence_count + 1
      end,
      first_seen_at = case
        when existing.status = 'resolved' then now()
        else first_seen_at
      end,
      last_seen_at = now(),
      last_notified_at = case
        when should_notify then now()
        else last_notified_at
      end,
      resolved_at = null
    where incident_key = p_incident_key;

    return should_notify;
  end if;

  update public.integration_health_incidents
  set status = 'resolved', resolved_at = now(), last_seen_at = now()
  where incident_key = p_incident_key
    and status = 'active';
  return false;
end;
$$;

revoke all on function public.record_integration_incident(
  text, text, boolean, text, text, text
) from public, anon, authenticated;
grant execute on function public.record_integration_incident(
  text, text, boolean, text, text, text
) to service_role;

create or replace function public.check_shopify_sync_health()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  last_success timestamptz;
  should_notify boolean;
  alert_message text;
begin
  select max(completed_at) into last_success
  from public.sync_logs
  where status = 'Success'
    and completed_at is not null;

  if last_success is null or last_success < now() - interval '2 hours' then
    alert_message := case
      when last_success is null
        then 'No successful Shopify synchronization has been recorded.'
      else format(
        'The last successful Shopify synchronization was %s ago.',
        date_trunc('minute', now() - last_success)
      )
    end;

    should_notify := public.record_integration_incident(
      'shopify_sync_stale',
      'shopify',
      true,
      'critical',
      'Shopify sync is stale',
      alert_message
    );

    if should_notify then
      insert into public.app_notifications (
        user_id,
        title,
        message,
        label,
        icon,
        target_type,
        target_value
      )
      select
        profile.id,
        'Shopify sync is stale',
        alert_message,
        'SYNC ALERT',
        'warning-outline',
        'shopify_sync',
        'health'
      from public.profiles as profile
      where profile.is_admin = true;
    end if;
  else
    perform public.record_integration_incident(
      'shopify_sync_stale',
      'shopify',
      false,
      'warning',
      'Shopify sync recovered',
      'Shopify synchronization is healthy again.'
    );
  end if;
end;
$$;

revoke all on function public.check_shopify_sync_health()
  from public, anon, authenticated;

do $$
declare
  test_key constant text := 'shopify_sync_monitor_migration_test';
begin
  delete from public.integration_health_incidents where incident_key = test_key;

  if not public.record_integration_incident(
    test_key, 'shopify', true, 'warning', 'Test', 'Test'
  ) then
    raise exception 'Expected a new integration incident to notify';
  end if;

  if public.record_integration_incident(
    test_key, 'shopify', true, 'warning', 'Test', 'Test'
  ) then
    raise exception 'Expected a repeated integration incident to be deduplicated';
  end if;

  perform public.record_integration_incident(
    test_key, 'shopify', false, 'warning', 'Test', 'Resolved'
  );

  if not public.record_integration_incident(
    test_key, 'shopify', true, 'warning', 'Test', 'Test'
  ) then
    raise exception 'Expected a recurring resolved incident to notify again';
  end if;

  delete from public.integration_health_incidents where incident_key = test_key;
end;
$$;

do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'shopify-sync-health-monitor'
  ) then
    perform cron.unschedule('shopify-sync-health-monitor');
  end if;

  perform cron.schedule(
    'shopify-sync-health-monitor',
    '30 * * * *',
    'select public.check_shopify_sync_health();'
  );
end;
$$;
