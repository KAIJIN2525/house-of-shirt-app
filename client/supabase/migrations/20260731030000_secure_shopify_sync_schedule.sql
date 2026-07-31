-- Replace the public hourly sync call with a shared-secret authenticated job.
-- Configure the same value in Edge Function secrets as SHOPIFY_SYNC_SECRET and
-- in Supabase Vault as shopify_sync_secret before applying this migration.
do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'shopify-sync-hourly'
  ) then
    perform cron.unschedule('shopify-sync-hourly');
  end if;

  if exists (
    select 1 from vault.decrypted_secrets
    where name = 'shopify_sync_secret'
      and nullif(decrypted_secret, '') is not null
  ) then
    perform cron.schedule(
      'shopify-sync-hourly',
      '0 * * * *',
      $schedule$
        select net.http_post(
          url := 'https://ozagezixsmodmgxbwexm.supabase.co/functions/v1/shopify-sync/run',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-shopify-sync-secret', (
              select decrypted_secret
              from vault.decrypted_secrets
              where name = 'shopify_sync_secret'
              limit 1
            )
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 300000
        ) as request_id;
      $schedule$
    );
  else
    raise notice 'shopify-sync-hourly was not scheduled: Vault secret shopify_sync_secret is missing';
  end if;
end
$$;
