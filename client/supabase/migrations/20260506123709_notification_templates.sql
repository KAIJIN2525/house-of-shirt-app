-- Create Notification Templates Table
CREATE TABLE public.notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE, -- e.g., 'new_arrival', 'order_dispatched'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Notification templates are viewable by everyone."
  ON public.notification_templates FOR SELECT
  USING ( true );

CREATE POLICY "Only admins can modify notification templates."
  ON public.notification_templates FOR ALL
  USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_notification_templates 
  BEFORE UPDATE ON public.notification_templates 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Seed the initial templates
INSERT INTO public.notification_templates (event_key, title, body)
VALUES 
  ('new_arrival', '🔥 Fresh Drop!', '[Collection Name] is finally live! Discover our latest styles and grab your favorites before they''re gone.'),
  ('order_dispatched', '🚚 On the way!', 'Great news! Your order #[OrderNo] has been dispatched. You can track your package with Waybill: [Waybill].'),
  ('delivery_unsuccessful', '⚠️ Delivery Alert', 'Our rider was unable to reach you for order #[OrderNo]. Waybill: [Waybill]. Please check your phone or contact GIGL to reschedule.'),
  ('available_pickup', '📦 Available for Pickup', 'Your order #[OrderNo] has arrived at the pickup station. Bring your Waybill ([Waybill]) for collection!'),
  ('order_confirmed', '✅ Order Received', 'Thank you for shopping! We''ve received order #[OrderNo] and we''re getting it ready for you.'),
  ('abandoned_cart', '🛒 Still thinking?', 'We saved the items in your cart! Complete your order now before they sell out.');
