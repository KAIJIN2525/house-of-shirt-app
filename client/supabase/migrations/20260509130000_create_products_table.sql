-- Migration to create the products table for Shopify Sync
CREATE TABLE public.products (
  id TEXT PRIMARY KEY, -- Shopify Product ID
  title TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  vendor TEXT,
  product_type TEXT,
  image_url TEXT,
  body_html TEXT,
  tags TEXT,
  status TEXT,
  variants JSONB, -- Stores size/color/price combinations
  options JSONB,  -- Stores size/color options
  shopify_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING (true);

-- Only admins can modify (The Edge Function uses Service Role, so it bypasses this)
CREATE POLICY "Admins can modify products" 
  ON public.products FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_products 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
