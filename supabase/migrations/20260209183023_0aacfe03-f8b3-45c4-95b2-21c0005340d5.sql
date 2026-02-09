
-- Notification preferences for WhatsApp/SMS per user
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'sms', 'email', 'push')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  phone_number TEXT,
  notify_shipment_updates BOOLEAN DEFAULT true,
  notify_payment_updates BOOLEAN DEFAULT true,
  notify_contract_alerts BOOLEAN DEFAULT true,
  notify_system_alerts BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_type)
);

ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification channels"
ON public.notification_channels FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification channels"
ON public.notification_channels FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id),
  channel_type TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery logs"
ON public.notification_delivery_log FOR SELECT
USING (auth.uid() = recipient_user_id);

CREATE POLICY "Admins can view all delivery logs"
ON public.notification_delivery_log FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
