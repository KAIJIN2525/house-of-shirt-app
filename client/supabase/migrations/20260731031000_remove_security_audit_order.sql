-- Remove the single synthetic record created while detecting a stale webhook deployment.
delete from public.orders
where shopify_order_id = '999999999'
  and email = 'audit@example.invalid';
