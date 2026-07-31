alter table public.orders
  add column if not exists shopify_event_at timestamptz;

create index if not exists orders_shopify_event_at_idx
  on public.orders (shopify_order_id, shopify_event_at desc)
  where shopify_order_id is not null;

comment on column public.orders.shopify_event_at is
  'Latest Shopify resource timestamp applied to this order; older webhook payloads are ignored.';
