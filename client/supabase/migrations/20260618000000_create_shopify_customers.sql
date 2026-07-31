create table if not exists public.shopify_customers (
  shopify_id text primary key,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  city text,
  country text,
  blacklisted boolean not null default false,
  blacklist_reason text,
  blacklisted_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists shopify_customers_email_lower_idx
  on public.shopify_customers(lower(email));

alter table public.shopify_customers enable row level security;

create policy "Admins can manage shopify_customers"
  on public.shopify_customers
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Authenticated users can read their own record (for checkout blacklist check)
create policy "Users can read their own record"
  on public.shopify_customers
  for select
  using (
    lower(email) = lower((select email from auth.users where id = auth.uid()))
  );
