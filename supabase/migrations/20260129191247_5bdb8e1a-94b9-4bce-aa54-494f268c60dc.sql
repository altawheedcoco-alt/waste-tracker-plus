-- Create partner_notes table for exchanging notes between organizations
CREATE TABLE public.partner_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receiver_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add indexes for better performance
CREATE INDEX idx_partner_notes_sender ON public.partner_notes(sender_organization_id);
CREATE INDEX idx_partner_notes_receiver ON public.partner_notes(receiver_organization_id);
CREATE INDEX idx_partner_notes_created_at ON public.partner_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notes sent to or from their organization
CREATE POLICY "Users can view notes for their organization"
ON public.partner_notes
FOR SELECT
USING (
  sender_organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  OR receiver_organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Policy: Users can create notes from their organization
CREATE POLICY "Users can create notes from their organization"
ON public.partner_notes
FOR INSERT
WITH CHECK (
  sender_organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Policy: Receivers can update to mark as read
CREATE POLICY "Receivers can update notes to mark as read"
ON public.partner_notes
FOR UPDATE
USING (
  receiver_organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Policy: Senders can delete their notes
CREATE POLICY "Senders can delete their notes"
ON public.partner_notes
FOR DELETE
USING (
  sender_organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Trigger for updating updated_at
CREATE TRIGGER update_partner_notes_updated_at
BEFORE UPDATE ON public.partner_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();