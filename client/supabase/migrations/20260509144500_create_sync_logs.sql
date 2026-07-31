-- Create sync_logs table to track Shopify integration history
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Success',
  products_imported INTEGER DEFAULT 0,
  customers_imported INTEGER DEFAULT 0,
  orders_imported INTEGER DEFAULT 0,
  summary TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read logs
CREATE POLICY "Admins can view sync logs"
  ON public.sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
