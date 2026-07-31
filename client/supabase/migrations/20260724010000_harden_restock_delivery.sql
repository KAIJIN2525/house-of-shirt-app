alter table public.back_in_stock_requests
  add column if not exists notification_attempts integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error text,
  add column if not exists delivery_report jsonb not null default '{}'::jsonb;

create index if not exists back_in_stock_requests_retry_idx
  on public.back_in_stock_requests(status, last_attempt_at)
  where status = 'pending';
