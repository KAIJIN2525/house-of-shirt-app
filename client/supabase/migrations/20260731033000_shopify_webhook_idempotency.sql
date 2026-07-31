create table if not exists public.shopify_webhook_deliveries (
  webhook_id text primary key,
  event_id text,
  topic text not null,
  shop_domain text,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists shopify_webhook_deliveries_event_id_idx
  on public.shopify_webhook_deliveries (event_id)
  where event_id is not null;

create index if not exists shopify_webhook_deliveries_created_at_idx
  on public.shopify_webhook_deliveries (created_at desc);

alter table public.shopify_webhook_deliveries enable row level security;

create or replace function public.claim_shopify_webhook(
  p_webhook_id text,
  p_event_id text,
  p_topic text,
  p_shop_domain text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean := false;
begin
  insert into public.shopify_webhook_deliveries (
    webhook_id,
    event_id,
    topic,
    shop_domain
  )
  values (
    p_webhook_id,
    nullif(p_event_id, ''),
    p_topic,
    nullif(p_shop_domain, '')
  )
  on conflict (webhook_id) do update
  set
    status = 'processing',
    attempt_count = public.shopify_webhook_deliveries.attempt_count + 1,
    last_error = null,
    updated_at = now(),
    completed_at = null
  where public.shopify_webhook_deliveries.status = 'failed'
     or (
       public.shopify_webhook_deliveries.status = 'processing'
       and public.shopify_webhook_deliveries.updated_at < now() - interval '5 minutes'
     )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_shopify_webhook(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_shopify_webhook(text, text, text, text)
  to service_role;

comment on table public.shopify_webhook_deliveries is
  'Persistent delivery ledger for Shopify webhook retry deduplication.';
-- Migration-time regression check: a delivery is claimed once, while a failed
-- delivery can be claimed again on Shopify's next retry.
do $$
declare
  test_webhook_id constant text := '00000000-0000-0000-0000-000000000000';
begin
  delete from public.shopify_webhook_deliveries
  where webhook_id = test_webhook_id;

  if not public.claim_shopify_webhook(
    test_webhook_id,
    '',
    'orders/create',
    'audit.invalid'
  ) then
    raise exception 'Expected the first webhook claim to succeed';
  end if;

  if public.claim_shopify_webhook(
    test_webhook_id,
    '',
    'orders/create',
    'audit.invalid'
  ) then
    raise exception 'Expected a concurrent duplicate webhook claim to be skipped';
  end if;

  update public.shopify_webhook_deliveries
  set status = 'failed', updated_at = now()
  where webhook_id = test_webhook_id;

  if not public.claim_shopify_webhook(
    test_webhook_id,
    '',
    'orders/create',
    'audit.invalid'
  ) then
    raise exception 'Expected a failed webhook delivery to be retryable';
  end if;

  delete from public.shopify_webhook_deliveries
  where webhook_id = test_webhook_id;
end;
$$;