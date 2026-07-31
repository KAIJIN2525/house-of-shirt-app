create table if not exists public.back_in_stock_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  shopify_product_id text,
  product_title text not null,
  size text not null,
  email text,
  phone text,
  notification_channels jsonb not null default '["app", "push", "email"]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'notified', 'cancelled')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, size)
);

alter table public.back_in_stock_requests enable row level security;

drop policy if exists "Users can view their own back in stock requests"
  on public.back_in_stock_requests;
create policy "Users can view their own back in stock requests"
  on public.back_in_stock_requests
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "Users can create their own back in stock requests"
  on public.back_in_stock_requests;
create policy "Users can create their own back in stock requests"
  on public.back_in_stock_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own back in stock requests"
  on public.back_in_stock_requests;
create policy "Users can update their own back in stock requests"
  on public.back_in_stock_requests
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

create index if not exists back_in_stock_requests_status_idx
  on public.back_in_stock_requests(status);

create index if not exists back_in_stock_requests_product_size_idx
  on public.back_in_stock_requests(product_id, size);

drop trigger if exists handle_updated_at_back_in_stock_requests
  on public.back_in_stock_requests;

create trigger handle_updated_at_back_in_stock_requests
  before update on public.back_in_stock_requests
  for each row
  execute procedure public.handle_updated_at();
