-- Add email and shopify_order_id to orders for better tracking and linking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS shopify_order_id TEXT UNIQUE;

-- Index for performance when looking up by email
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);

-- Add email column to profiles if missing (already there, but good to ensure)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
