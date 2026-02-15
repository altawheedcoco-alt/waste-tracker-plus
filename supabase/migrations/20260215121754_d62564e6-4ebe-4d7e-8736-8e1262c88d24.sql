
-- Universal Notes System
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Polymorphic reference to any resource
  resource_type TEXT NOT NULL, -- 'shipment', 'contract', 'invoice', 'deposit', 'vehicle', 'driver', 'customer', 'award_letter', 'signing_request', 'general'
  resource_id UUID NOT NULL,
  
  -- Threading
  parent_note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'comment', -- 'comment', 'instruction', 'warning', 'approval', 'rejection', 'question', 'answer'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Inter-organization visibility
  visibility TEXT NOT NULL DEFAULT 'internal', -- 'internal' (own org only), 'partner' (shared with partner org), 'public' (all linked orgs)
  target_organization_id UUID REFERENCES public.organizations(id),
  
  -- Mentions
  mentioned_user_ids UUID[] DEFAULT '{}',
  
  -- Attachments
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notes_resource ON public.notes(resource_type, resource_id);
CREATE INDEX idx_notes_organization ON public.notes(organization_id);
CREATE INDEX idx_notes_author ON public.notes(author_id);
CREATE INDEX idx_notes_parent ON public.notes(parent_note_id);
CREATE INDEX idx_notes_target_org ON public.notes(target_organization_id);
CREATE INDEX idx_notes_created ON public.notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see notes from their own org OR notes shared with their org
CREATE POLICY "Users can view own org notes"
  ON public.notes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    (visibility IN ('partner', 'public') AND target_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

-- RLS: Users can create notes for their own org
CREATE POLICY "Users can create notes"
  ON public.notes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND author_id = auth.uid()
  );

-- RLS: Authors can update their own notes
CREATE POLICY "Authors can update own notes"
  ON public.notes FOR UPDATE
  USING (author_id = auth.uid());

-- RLS: Authors can delete their own notes
CREATE POLICY "Authors can delete own notes"
  ON public.notes FOR DELETE
  USING (author_id = auth.uid());

-- Note read tracking
CREATE TABLE public.note_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);

ALTER TABLE public.note_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reads"
  ON public.note_reads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- Notification trigger for new notes
CREATE OR REPLACE FUNCTION public.notify_note_created()
RETURNS TRIGGER AS $$
DECLARE
  _author_name TEXT;
  _resource_label TEXT;
  _mentioned_id UUID;
BEGIN
  SELECT full_name INTO _author_name FROM public.profiles WHERE id = NEW.author_id;
  
  _resource_label := CASE NEW.resource_type
    WHEN 'shipment' THEN 'شحنة'
    WHEN 'contract' THEN 'عقد'
    WHEN 'invoice' THEN 'فاتورة'
    WHEN 'deposit' THEN 'إيداع'
    WHEN 'vehicle' THEN 'مركبة'
    WHEN 'driver' THEN 'سائق'
    WHEN 'customer' THEN 'عميل'
    WHEN 'award_letter' THEN 'خطاب ترسية'
    WHEN 'signing_request' THEN 'طلب توقيع'
    ELSE 'عنصر'
  END;

  -- Notify mentioned users
  IF NEW.mentioned_user_ids IS NOT NULL AND array_length(NEW.mentioned_user_ids, 1) > 0 THEN
    FOREACH _mentioned_id IN ARRAY NEW.mentioned_user_ids
    LOOP
      INSERT INTO public.notifications (user_id, organization_id, title, message, type, resource_type, resource_id)
      VALUES (
        _mentioned_id,
        NEW.organization_id,
        'إشارة في ملاحظة',
        format('أشار إليك %s في ملاحظة على %s', _author_name, _resource_label),
        'mention',
        NEW.resource_type,
        NEW.resource_id
      );
    END LOOP;
  END IF;

  -- Notify target org if partner visibility
  IF NEW.visibility = 'partner' AND NEW.target_organization_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, organization_id, title, message, type, resource_type, resource_id)
    SELECT 
      p.id,
      NEW.target_organization_id,
      'ملاحظة جديدة من شريك',
      format('أضاف %s ملاحظة على %s', _author_name, _resource_label),
      'partner_note',
      NEW.resource_type,
      NEW.resource_id
    FROM public.profiles p
    WHERE p.organization_id = NEW.target_organization_id
    LIMIT 5;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_note_created
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_created();
