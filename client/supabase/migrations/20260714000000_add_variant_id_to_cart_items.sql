-- Store Shopify variant IDs in cart rows so app-created Shopify orders can use real product variants.
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS variant_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id
  ON public.cart_items(variant_id);
