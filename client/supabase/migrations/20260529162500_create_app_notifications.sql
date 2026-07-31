create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  label text default 'HOUSE UPDATE',
  icon text default 'notifications-outline',
  target_type text,
  target_value text,
  read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_notifications enable row level security;

drop policy if exists "Users can view their own app notifications"
  on public.app_notifications;
create policy "Users can view their own app notifications"
  on public.app_notifications
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "Users can update their own app notifications"
  on public.app_notifications;
create policy "Users can update their own app notifications"
  on public.app_notifications
  for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "Admins and service role can create app notifications"
  on public.app_notifications;
create policy "Admins and service role can create app notifications"
  on public.app_notifications
  for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create index if not exists app_notifications_user_created_idx
  on public.app_notifications(user_id, created_at desc);

drop trigger if exists handle_updated_at_app_notifications
  on public.app_notifications;

create trigger handle_updated_at_app_notifications
  before update on public.app_notifications
  for each row
  execute procedure public.handle_updated_at();
