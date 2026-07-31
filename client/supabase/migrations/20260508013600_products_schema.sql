-- Create products table for Shopify Sync
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  handle TEXT,
  vendor TEXT,
  product_type TEXT,
  status TEXT,
  image_url TEXT,
  price DECIMAL(12,2) DEFAULT 0.00,
  compare_at_price DECIMAL(12,2) DEFAULT 0.00,
  inventory_quantity INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Products can be modified by service role only" ON public.products
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create an index on shopify_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON public.products(shopify_id);
