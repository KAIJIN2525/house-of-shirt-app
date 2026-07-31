-- Allow users to insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Allow users to update their own orders (e.g. for metadata or cancellations if needed)
-- (Actually, usually only status changes, but let's keep it safe)
-- CREATE POLICY "Users can update their own orders"
--   ON public.orders FOR UPDATE
--   USING ( auth.uid() = user_id );
