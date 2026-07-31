-- Activate the hourly Shopify sync after its shared secret has been configured.
do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'shopify-sync-hourly'
  ) then
    perform cron.unschedule('shopify-sync-hourly');
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'shopify_sync_secret'
      and nullif(decrypted_secret, '') is not null
  ) then
    raise exception 'Vault secret shopify_sync_secret is missing';
  end if;

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
end
$$;
