-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_response', 'resolved', 'closed');

-- Create enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for ticket category
CREATE TYPE public.ticket_category AS ENUM ('bug', 'feature_request', 'technical_issue', 'billing', 'general', 'complaint', 'suggestion');

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- Partner reference (optional - if ticket involves a partner)
  partner_organization_id UUID REFERENCES public.organizations(id),
  related_shipment_id UUID REFERENCES public.shipments(id),
  
  -- Ticket details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'general',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  
  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ticket messages table for conversation
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_organization_id UUID REFERENCES public.organizations(id),
  
  -- Message content
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false, -- Admin-only notes
  is_from_admin BOOLEAN DEFAULT false,
  
  -- Attachments
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create ticket watchers table (for partners to follow tickets)
CREATE TABLE public.ticket_watchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  added_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_watchers ENABLE ROW LEVEL SECURITY;

-- Generate ticket number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                       LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();

-- Update timestamps trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for support_tickets

-- Admins can see all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Organizations can view their own tickets
CREATE POLICY "Organizations can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  OR partner_organization_id = public.get_user_organization_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.ticket_watchers tw
    WHERE tw.ticket_id = support_tickets.id
    AND tw.organization_id = public.get_user_organization_id(auth.uid())
  )
);

-- Organizations can create tickets
CREATE POLICY "Organizations can create tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
);

-- Organizations can update their own tickets (limited fields)
CREATE POLICY "Organizations can update own tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for ticket_messages

-- Admins can see all messages
CREATE POLICY "Admins can view all messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create messages
CREATE POLICY "Admins can create messages"
ON public.ticket_messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Organizations can view messages on their tickets (except internal notes)
CREATE POLICY "Organizations can view ticket messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  is_internal_note = false
  AND EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_messages.ticket_id
    AND (
      st.organization_id = public.get_user_organization_id(auth.uid())
      OR st.partner_organization_id = public.get_user_organization_id(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ticket_watchers tw
        WHERE tw.ticket_id = st.id
        AND tw.organization_id = public.get_user_organization_id(auth.uid())
      )
    )
  )
);

-- Organizations can add messages to their tickets
CREATE POLICY "Organizations can add messages"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_messages.ticket_id
    AND (
      st.organization_id = public.get_user_organization_id(auth.uid())
      OR st.partner_organization_id = public.get_user_organization_id(auth.uid())
    )
  )
);

-- RLS Policies for ticket_watchers
CREATE POLICY "Admins can manage watchers"
ON public.ticket_watchers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizations can view their watch entries"
ON public.ticket_watchers FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Notify admin on new ticket
CREATE OR REPLACE FUNCTION public.notify_admin_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name FROM organizations WHERE id = NEW.organization_id;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(ur.user_id) INTO v_admin_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Send notifications to all admins
  IF v_admin_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_admin_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        v_user_id,
        '🎫 تذكرة دعم جديدة: ' || NEW.ticket_number,
        'تذكرة جديدة من ' || COALESCE(v_org_name, 'جهة') || ': ' || NEW.title,
        'support_ticket'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_new_ticket_trigger
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_ticket();

-- Notify organization on ticket update
CREATE OR REPLACE FUNCTION public.notify_ticket_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_ids UUID[];
  v_user_id UUID;
  v_status_text TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get status text in Arabic
  CASE NEW.status
    WHEN 'open' THEN v_status_text := 'مفتوحة';
    WHEN 'in_progress' THEN v_status_text := 'قيد المعالجة';
    WHEN 'waiting_response' THEN v_status_text := 'في انتظار الرد';
    WHEN 'resolved' THEN v_status_text := 'تم الحل';
    WHEN 'closed' THEN v_status_text := 'مغلقة';
    ELSE v_status_text := NEW.status::text;
  END CASE;

  -- Get user IDs from organization
  SELECT ARRAY_AGG(p.user_id) INTO v_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.organization_id AND p.is_active = true;

  -- Send notifications
  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        v_user_id,
        'تحديث التذكرة ' || NEW.ticket_number,
        'تم تحديث حالة التذكرة إلى: ' || v_status_text,
        'support_ticket'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_ticket_update_trigger
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_update();

-- Add indexes for performance
CREATE INDEX idx_support_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_watchers_ticket ON public.ticket_watchers(ticket_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;