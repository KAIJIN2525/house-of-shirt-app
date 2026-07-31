-- Avoid querying auth.users from an authenticated RLS policy. The signed JWT
-- already contains the authenticated user's verified email claim.

drop policy if exists "Users can read their own record"
  on public.shopify_customers;

create policy "Users can read their own record"
  on public.shopify_customers
  for select
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
