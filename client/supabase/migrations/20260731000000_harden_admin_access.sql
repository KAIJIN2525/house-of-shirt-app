-- Harden administrator access and provide a controlled staff-access workflow.

create table if not exists public.admin_access_grants (
  email text primary key check (email = lower(trim(email))),
  user_id uuid unique references auth.users(id) on delete set null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.admin_access_grants enable row level security;

insert into public.admin_access_grants (email, role, status)
values ('ememedavid086@gmail.com', 'owner', 'active')
on conflict (email) do update
set role = 'owner', status = 'active', revoked_by = null, revoked_at = null, updated_at = now();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_access_grants grant_record
    where grant_record.status = 'active'
      and (
        grant_record.user_id = auth.uid()
        or grant_record.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

create policy "Users view own profile and admins view profiles"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.current_user_is_admin());

create policy "Users insert their own non-privileged profile"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and is_admin = public.current_user_is_admin()
  );

create policy "Users update their own non-privileged profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and is_admin = public.current_user_is_admin()
  );

create policy "Admins view staff access"
  on public.admin_access_grants for select to authenticated
  using (public.current_user_is_admin());

create table if not exists public.admin_access_events (
  id uuid primary key default gen_random_uuid(),
  target_email text not null,
  action text not null check (action in ('granted', 'revoked')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_access_events enable row level security;

create policy "Admins view staff access history"
  on public.admin_access_events for select to authenticated
  using (public.current_user_is_admin());

create or replace function public.set_admin_access(p_email text, p_enabled boolean)
returns public.admin_access_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  target_role text;
  result public.admin_access_grants;
begin
  if not public.current_user_is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if normalized_email = '' or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  select role into target_role
  from public.admin_access_grants
  where email = normalized_email;

  if not p_enabled and target_role = 'owner' then
    raise exception 'The workspace owner cannot be removed' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.admin_access_grants (
      email, user_id, role, status, granted_by, granted_at, revoked_by, revoked_at, updated_at
    )
    values (
      normalized_email,
      (select id from auth.users where lower(email) = normalized_email limit 1),
      'admin', 'active', auth.uid(), now(), null, null, now()
    )
    on conflict (email) do update
    set user_id = coalesce(excluded.user_id, public.admin_access_grants.user_id),
        status = 'active',
        granted_by = auth.uid(),
        granted_at = now(),
        revoked_by = null,
        revoked_at = null,
        updated_at = now()
    returning * into result;
  else
    update public.admin_access_grants
    set status = 'revoked', revoked_by = auth.uid(), revoked_at = now(), updated_at = now()
    where email = normalized_email
    returning * into result;

    if result.email is null then
      raise exception 'Staff access record not found' using errcode = 'P0002';
    end if;
  end if;

  update public.profiles
  set is_admin = p_enabled, updated_at = now()
  where lower(email) = normalized_email;

  insert into public.admin_access_events (target_email, action, actor_id)
  values (normalized_email, case when p_enabled then 'granted' else 'revoked' end, auth.uid());

  return result;
end;
$$;

revoke all on function public.set_admin_access(text, boolean) from public;
grant execute on function public.set_admin_access(text, boolean) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  has_admin_access boolean;
begin
  select exists (
    select 1 from public.admin_access_grants
    where email = normalized_email and status = 'active'
  ) into has_admin_access;

  insert into public.profiles (id, email, full_name, is_admin)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', has_admin_access);

  if has_admin_access then
    update public.admin_access_grants set user_id = new.id, updated_at = now()
    where email = normalized_email;
  end if;

  return new;
end;
$$;

update public.admin_access_grants grant_record
set user_id = profile.id, updated_at = now()
from public.profiles profile
where lower(profile.email) = grant_record.email;

update public.profiles profile
set is_admin = exists (
  select 1 from public.admin_access_grants grant_record
  where grant_record.email = lower(profile.email) and grant_record.status = 'active'
), updated_at = now();
