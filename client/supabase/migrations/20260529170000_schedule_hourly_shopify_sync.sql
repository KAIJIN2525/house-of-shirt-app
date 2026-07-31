create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'shopify-sync-hourly'
  ) then
    perform cron.unschedule('shopify-sync-hourly');
  end if;
end
$$;

select cron.schedule(
  'shopify-sync-hourly',
  '0 * * * *',
  $$
    select net.http_post(
      url := 'https://ozagezixsmodmgxbwexm.supabase.co/functions/v1/shopify-sync/run',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) as request_id;
  $$
);
