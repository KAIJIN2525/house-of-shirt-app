-- Order reconciliation idempotency.
--
-- Shopify order state reaches this table from three independent writers:
--   * shopify-webhook   (per-delivery, near real time)
--   * admin-orders      (admin-triggered "refresh latest orders")
--   * shopify-sync      (scheduled hourly bulk sync)
--
-- Only the webhook guarded against stale writes. The other two issued an
-- unconditional `upsert(..., { onConflict: "shopify_order_id" })`, so a bulk
-- refresh carrying an older Shopify snapshot could overwrite newer state that a
-- webhook had already applied -- for example resetting a cancelled order back
-- to Processing.
--
-- Enforcing the rule in the database rather than in each caller means every
-- writer, including any added later, is covered by construction.

create or replace function public.skip_stale_shopify_order_write()
returns trigger
language plpgsql
as $$
begin
  -- Only Shopify-sourced writes carry an event timestamp. Rows updated by the
  -- app (an admin changing status, say) leave shopify_event_at untouched, so
  -- NEW matches OLD and the write proceeds normally.
  if new.shopify_event_at is not null
     and old.shopify_event_at is not null
     and new.shopify_event_at < old.shopify_event_at then
    -- Returning OLD from a BEFORE UPDATE trigger discards the incoming values
    -- and leaves the stored row intact.
    return old;
  end if;

  return new;
end;
$$;

comment on function public.skip_stale_shopify_order_write() is
  'Discards order updates carrying an older shopify_event_at than the stored row, so out-of-order Shopify writes cannot regress newer state.';

drop trigger if exists orders_skip_stale_shopify_write on public.orders;

create trigger orders_skip_stale_shopify_write
  before update on public.orders
  for each row
  execute function public.skip_stale_shopify_order_write();

-- Keeps the conditional webhook updates (which filter on shopify_event_at) and
-- the per-order lookups the reconciliation paths perform off a sequential scan.
create index if not exists orders_shopify_order_id_event_at_idx
  on public.orders (shopify_order_id, shopify_event_at desc)
  where shopify_order_id is not null;
