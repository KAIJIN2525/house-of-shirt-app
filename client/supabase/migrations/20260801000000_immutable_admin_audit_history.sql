alter table public.managed_app_content
  drop constraint if exists managed_app_content_content_key_check;
alter table public.managed_app_content
  add constraint managed_app_content_content_key_check
  check (content_key in ('welcome', 'onboarding', 'admin_settings'));

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null check (audience in ('all', 'vip', 'new')),
  status text not null check (status in ('Draft', 'Scheduled', 'Sent')),
  scheduled_for_text text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  target_type text,
  target_value text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_campaigns enable row level security;

create policy "Admins manage notification campaigns"
  on public.notification_campaigns
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create trigger handle_updated_at_notification_campaigns
  before update on public.notification_campaigns
  for each row execute procedure public.handle_updated_at();

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null default 'admin',
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  resource_type text not null,
  resource_id text,
  changed_fields text[] not null default '{}',
  old_record jsonb,
  new_record jsonb,
  request_id text
);

create index if not exists admin_audit_log_occurred_at_idx
  on public.admin_audit_log (occurred_at desc);
create index if not exists admin_audit_log_resource_idx
  on public.admin_audit_log (resource_type, resource_id, occurred_at desc);
create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, occurred_at desc);

alter table public.admin_audit_log enable row level security;

create policy "Admins view immutable audit history"
  on public.admin_audit_log
  for select
  to authenticated
  using (public.current_user_is_admin());

create or replace function public.capture_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_json jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_json jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  record_json jsonb := coalesce(new_json, old_json);
  fields text[] := '{}';
  audit_actor uuid := auth.uid();
  request_headers jsonb := '{}'::jsonb;
begin
  -- Customer self-service writes are deliberately excluded. Privileged writes
  -- made with an authenticated admin session are captured automatically.
  if audit_actor is null or not public.current_user_is_admin() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from (
      select key from jsonb_object_keys(old_json || new_json) as key
      where old_json -> key is distinct from new_json -> key
    ) changed;
  elsif tg_op = 'INSERT' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from jsonb_object_keys(new_json) as key;
  else
    select coalesce(array_agg(key order by key), '{}') into fields
    from jsonb_object_keys(old_json) as key;
  end if;

  begin
    request_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
  exception when others then
    request_headers := '{}'::jsonb;
  end;

  insert into public.admin_audit_log (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    changed_fields,
    old_record,
    new_record,
    request_id
  ) values (
    audit_actor,
    'admin',
    tg_op,
    tg_table_name,
    coalesce(
      record_json ->> 'id',
      record_json ->> 'shopify_id',
      record_json ->> 'content_key',
      record_json ->> 'event_key',
      record_json ->> 'email'
    ),
    fields,
    old_json,
    new_json,
    request_headers ->> 'x-request-id'
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.prevent_admin_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Admin audit history is immutable' using errcode = '42501';
end;
$$;

create trigger prevent_admin_audit_update_or_delete
  before update or delete on public.admin_audit_log
  for each row execute function public.prevent_admin_audit_mutation();

do $$
declare
  audited_table text;
begin
  foreach audited_table in array array[
    'orders',
    'shopify_customers',
    'media_assets',
    'editorials',
    'managed_app_content',
    'notification_templates',
    'notification_campaigns',
    'admin_access_grants'
  ] loop
    execute format(
      'drop trigger if exists capture_admin_audit_event on public.%I',
      audited_table
    );
    execute format(
      'create trigger capture_admin_audit_event after insert or update or delete on public.%I for each row execute function public.capture_admin_audit_event()',
      audited_table
    );
  end loop;
end;
$$;

revoke all on table public.admin_audit_log from anon, authenticated;
grant select on table public.admin_audit_log to authenticated;

comment on table public.admin_audit_log is
  'Append-only history of authenticated administrator changes to privileged resources.';
