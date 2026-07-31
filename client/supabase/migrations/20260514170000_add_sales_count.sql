-- Add sales_count to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Create an index to easily sort by sales_count
CREATE INDEX IF NOT EXISTS products_sales_count_idx ON public.products(sales_count DESC);
