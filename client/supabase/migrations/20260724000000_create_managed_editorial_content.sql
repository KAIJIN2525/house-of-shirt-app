create extension if not exists pgcrypto;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'assets',
  storage_path text not null,
  public_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text not null,
  original_filename text,
  folder text not null default 'library',
  size_bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  alt_text text,
  archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.editorials (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  overlay_label text not null,
  cta_text text not null,
  target_url text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  image_url text,
  display_start timestamptz,
  display_end timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'live', 'archived')),
  is_default boolean not null default false,
  version integer not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_schedule_is_valid check (
    display_end is null
    or display_start is null
    or display_end > display_start
  )
);

create table if not exists public.managed_app_content (
  content_key text primary key check (content_key in ('welcome', 'onboarding')),
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorials_publication_idx
  on public.editorials(status, display_start desc, display_end);
create index if not exists editorials_default_idx
  on public.editorials(is_default, updated_at desc);
create index if not exists media_assets_library_idx
  on public.media_assets(archived, folder, created_at desc);

drop trigger if exists handle_updated_at_media_assets on public.media_assets;
create trigger handle_updated_at_media_assets
before update on public.media_assets
for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at_editorials on public.editorials;
create trigger handle_updated_at_editorials
before update on public.editorials
for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at_managed_app_content on public.managed_app_content;
create trigger handle_updated_at_managed_app_content
before update on public.managed_app_content
for each row execute procedure public.handle_updated_at();

alter table public.media_assets enable row level security;
alter table public.editorials enable row level security;
alter table public.managed_app_content enable row level security;

drop policy if exists "Anyone can read active media assets" on public.media_assets;
create policy "Anyone can read active media assets"
on public.media_assets for select
using (
  archived = false
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can manage media assets" on public.media_assets;
create policy "Admins can manage media assets"
on public.media_assets for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Anyone can read published editorials" on public.editorials;
create policy "Anyone can read published editorials"
on public.editorials for select
using (
  status in ('live', 'scheduled')
  or is_default = true
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can manage editorials" on public.editorials;
create policy "Admins can manage editorials"
on public.editorials for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Anyone can read managed app content" on public.managed_app_content;
create policy "Anyone can read managed app content"
on public.managed_app_content for select
using (true);

drop policy if exists "Admins can manage app content" on public.managed_app_content;
create policy "Admins can manage app content"
on public.managed_app_content for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read managed assets" on storage.objects;
create policy "Public can read managed assets"
on storage.objects for select
using (bucket_id = 'assets');

drop policy if exists "Admins can upload managed assets" on storage.objects;
create policy "Admins can upload managed assets"
on storage.objects for insert
with check (
  bucket_id = 'assets'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can update managed assets" on storage.objects;
create policy "Admins can update managed assets"
on storage.objects for update
using (
  bucket_id = 'assets'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  bucket_id = 'assets'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete managed assets" on storage.objects;
create policy "Admins can delete managed assets"
on storage.objects for delete
using (
  bucket_id = 'assets'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
