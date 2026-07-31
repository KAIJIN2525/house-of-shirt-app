create or replace function public.notify_admins_of_restock_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.app_notifications (
      user_id,
      title,
      message,
      label,
      icon,
      target_type,
      target_value
    )
    select
      profile.id,
      'New restock request',
      format(
        '%s requested %s in size %s.',
        coalesce(new.email, new.phone, 'A customer'),
        new.product_title,
        new.size
      ),
      'RESTOCK DEMAND',
      'cube-outline',
      'product',
      new.product_id
    from public.profiles as profile
    where profile.is_admin = true;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_admins_after_restock_request
  on public.back_in_stock_requests;

create trigger notify_admins_after_restock_request
after insert on public.back_in_stock_requests
for each row
execute function public.notify_admins_of_restock_request();
