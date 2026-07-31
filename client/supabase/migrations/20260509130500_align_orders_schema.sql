-- Migration to align orders table with app requirements
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS logistics_milestone TEXT DEFAULT 'Processing',
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is still correct
-- (Initial migration already handled this, but good to be safe)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
