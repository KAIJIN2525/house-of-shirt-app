-- Update products table to support modern sync logic
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shopify_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON public.products(shopify_id);
