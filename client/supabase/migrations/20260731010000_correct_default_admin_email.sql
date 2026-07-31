-- Correct the workspace owner email and remove access from the mistyped address.

update public.admin_access_grants
set role = 'admin',
    status = 'revoked',
    revoked_at = now(),
    updated_at = now()
where email = 'ememedavid086@gmail.com';

update public.profiles
set is_admin = false,
    updated_at = now()
where lower(email) = 'ememedavid086@gmail.com';

insert into public.admin_access_grants (email, user_id, role, status)
values (
  'emememdavid086@gmail.com',
  (select id from auth.users where lower(email) = 'emememdavid086@gmail.com' limit 1),
  'owner',
  'active'
)
on conflict (email) do update
set user_id = coalesce(excluded.user_id, public.admin_access_grants.user_id),
    role = 'owner',
    status = 'active',
    revoked_by = null,
    revoked_at = null,
    updated_at = now();

update public.profiles
set is_admin = true,
    updated_at = now()
where lower(email) = 'emememdavid086@gmail.com';
