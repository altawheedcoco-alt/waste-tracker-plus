
-- Signing Inbox: document signing requests between partner organizations
CREATE TABLE public.signing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Sender info
  sender_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  sender_user_id UUID NOT NULL REFERENCES auth.users(id),
  sender_profile_id UUID REFERENCES public.profiles(id),
  -- Recipient info
  recipient_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_profile_id UUID REFERENCES public.profiles(id),
  -- Document info
  document_type TEXT NOT NULL DEFAULT 'general',
  document_title TEXT NOT NULL,
  document_description TEXT,
  document_url TEXT,
  document_id UUID,
  related_shipment_id UUID REFERENCES public.shipments(id),
  -- Request details
  message TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requires_stamp BOOLEAN DEFAULT false,
  deadline TIMESTAMPTZ,
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'rejected', 'expired', 'cancelled')),
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Signature data (filled when signed)
  signature_id UUID REFERENCES public.document_signatures(id),
  signed_document_url TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signing_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_signing_requests_sender_org ON public.signing_requests(sender_organization_id);
CREATE INDEX idx_signing_requests_recipient_org ON public.signing_requests(recipient_organization_id);
CREATE INDEX idx_signing_requests_status ON public.signing_requests(status);
CREATE INDEX idx_signing_requests_recipient_user ON public.signing_requests(recipient_user_id);

-- RLS: Users can see requests where their org is sender or recipient
CREATE POLICY "Users can view their org signing requests"
  ON public.signing_requests FOR SELECT TO authenticated
  USING (
    sender_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR recipient_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS: Users can create requests from their org
CREATE POLICY "Users can create signing requests from their org"
  ON public.signing_requests FOR INSERT TO authenticated
  WITH CHECK (
    sender_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND sender_user_id = auth.uid()
  );

-- RLS: Sender can cancel, recipient can update status
CREATE POLICY "Users can update their signing requests"
  ON public.signing_requests FOR UPDATE TO authenticated
  USING (
    sender_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR recipient_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_signing_requests_updated_at
  BEFORE UPDATE ON public.signing_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger: notify recipient when a new signing request is created
CREATE OR REPLACE FUNCTION public.notify_signing_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the recipient user if specified
  IF NEW.recipient_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, title, message, type, related_id, related_type, organization_id
    ) VALUES (
      NEW.recipient_user_id,
      'طلب توقيع جديد',
      'لديك مستند جديد بعنوان "' || NEW.document_title || '" يتطلب توقيعك',
      'signing_request',
      NEW.id::text,
      'signing_request',
      NEW.recipient_organization_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_signing_request
  AFTER INSERT ON public.signing_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_signing_request();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.signing_requests;
