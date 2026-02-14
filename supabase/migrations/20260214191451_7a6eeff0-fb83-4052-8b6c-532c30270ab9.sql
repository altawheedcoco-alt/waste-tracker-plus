
-- 1. جدول تعيين السائق للشحنة (Driver ↔ Shipment Assignment)
CREATE TABLE public.driver_shipment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
    assignment_type TEXT NOT NULL DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'auto')),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(shipment_id, driver_id)
);

ALTER TABLE public.driver_shipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments in their org"
ON public.driver_shipment_assignments FOR SELECT
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Users can insert assignments in their org"
ON public.driver_shipment_assignments FOR INSERT
WITH CHECK (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Users can update assignments in their org"
ON public.driver_shipment_assignments FOR UPDATE
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

-- 2. جدول التقييم المتبادل (Mutual Ratings)
CREATE TABLE public.shipment_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    rater_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    rated_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    rater_type TEXT NOT NULL CHECK (rater_type IN ('generator', 'transporter', 'recycler')),
    rated_type TEXT NOT NULL CHECK (rated_type IN ('generator', 'transporter', 'recycler')),
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(shipment_id, rater_organization_id, rated_organization_id)
);

ALTER TABLE public.shipment_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings related to their org"
ON public.shipment_ratings FOR SELECT
USING (
    rater_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR rated_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "Users can insert ratings from their org"
ON public.shipment_ratings FOR INSERT
WITH CHECK (rater_organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

-- 3. سجل النزاعات (Dispute Log)
CREATE TABLE public.shipment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    raised_by_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    against_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('weight_difference', 'delay', 'damage', 'quality', 'documentation', 'pricing', 'other')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_value NUMERIC,
    actual_value NUMERIC,
    evidence_urls TEXT[],
    resolution TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    auto_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disputes related to their org"
ON public.shipment_disputes FOR SELECT
USING (
    raised_by_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR against_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "Users can create disputes from their org"
ON public.shipment_disputes FOR INSERT
WITH CHECK (raised_by_organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Users can update disputes related to their org"
ON public.shipment_disputes FOR UPDATE
USING (
    raised_by_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR against_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 4. إضافة صلاحية زمنية لربط الشركاء
ALTER TABLE public.partner_links 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id),
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_period_days INTEGER DEFAULT 365;

-- 5. جدول الإشعارات المتسلسلة (Chain Notifications)
CREATE TABLE public.chain_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL,
    trigger_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    target_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    target_user_id UUID,
    notification_type TEXT NOT NULL DEFAULT 'info' CHECK (notification_type IN ('info', 'action_required', 'warning', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_auto BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chain_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their org"
ON public.chain_notifications FOR SELECT
USING (target_organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "System can insert chain notifications"
ON public.chain_notifications FOR INSERT
WITH CHECK (trigger_organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Users can update their notifications (mark read)"
ON public.chain_notifications FOR UPDATE
USING (target_organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

-- 6. دالة لإنشاء إشعارات متسلسلة تلقائياً عند تغيير حالة الشحنة
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _shipment RECORD;
    _trigger_org_name TEXT;
    _status_label TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT name INTO _trigger_org_name FROM organizations WHERE id = NEW.transporter_id;
        
        _status_label := CASE NEW.status
            WHEN 'registered' THEN 'مسجلة'
            WHEN 'pending' THEN 'معلقة'
            WHEN 'approved' THEN 'معتمدة'
            WHEN 'picked_up' THEN 'تم الاستلام'
            WHEN 'in_transit' THEN 'في الطريق'
            WHEN 'delivered' THEN 'تم التسليم'
            WHEN 'unloaded' THEN 'تم التفريغ'
            WHEN 'confirmed' THEN 'مؤكدة'
            WHEN 'cancelled' THEN 'ملغاة'
            ELSE NEW.status
        END;

        -- إشعار المولد
        IF NEW.generator_id IS NOT NULL AND NEW.generator_id IS DISTINCT FROM NEW.transporter_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', COALESCE(NEW.transporter_id, NEW.generator_id), NEW.generator_id, 
                CASE WHEN NEW.status IN ('delivered', 'confirmed') THEN 'success' WHEN NEW.status = 'cancelled' THEN 'warning' ELSE 'info' END,
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'shipment_number', NEW.shipment_number));
        END IF;

        -- إشعار المدور
        IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', COALESCE(NEW.transporter_id, NEW.generator_id), NEW.recycler_id,
                CASE WHEN NEW.status IN ('in_transit', 'delivered') THEN 'action_required' WHEN NEW.status = 'confirmed' THEN 'success' ELSE 'info' END,
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label || CASE WHEN NEW.status = 'in_transit' THEN ' - يرجى الاستعداد للاستلام' ELSE '' END,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'shipment_number', NEW.shipment_number));
        END IF;

        -- إشعار الناقل (إذا لم يكن هو من غيّر الحالة)
        IF NEW.transporter_id IS NOT NULL AND NEW.transporter_id IS DISTINCT FROM NEW.generator_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', NEW.generator_id, NEW.transporter_id,
                'info',
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'shipment_number', NEW.shipment_number));
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shipment_status_notify
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.notify_shipment_status_change();

-- 7. دالة للتحقق التلقائي من انتهاء صلاحية ربط الشركاء
CREATE OR REPLACE FUNCTION public.check_partner_link_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() AND NEW.is_expired = false THEN
        IF NEW.auto_renew = true THEN
            NEW.expires_at := NEW.expires_at + (COALESCE(NEW.renewal_period_days, 365) || ' days')::interval;
            NEW.is_expired := false;
        ELSE
            NEW.is_expired := true;
            NEW.status := 'expired';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_partner_link_expiry
BEFORE UPDATE ON public.partner_links
FOR EACH ROW
EXECUTE FUNCTION public.check_partner_link_expiry();

-- 8. دالة كشف فرق الوزن التلقائي وإنشاء نزاع
CREATE OR REPLACE FUNCTION public.auto_detect_weight_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _weight_diff NUMERIC;
    _threshold NUMERIC := 0.05; -- 5% tolerance
BEGIN
    IF NEW.actual_weight IS NOT NULL AND NEW.quantity IS NOT NULL AND NEW.quantity > 0 THEN
        _weight_diff := ABS(NEW.actual_weight - NEW.quantity) / NEW.quantity;
        IF _weight_diff > _threshold THEN
            INSERT INTO shipment_disputes (
                shipment_id, raised_by_organization_id, against_organization_id,
                dispute_type, severity, title, description,
                expected_value, actual_value, auto_created
            ) VALUES (
                NEW.id,
                COALESCE(NEW.recycler_id, NEW.transporter_id),
                COALESCE(NEW.generator_id, NEW.transporter_id),
                'weight_difference',
                CASE WHEN _weight_diff > 0.20 THEN 'critical' WHEN _weight_diff > 0.10 THEN 'high' ELSE 'medium' END,
                'فرق وزن تلقائي - شحنة #' || NEW.shipment_number,
                'تم رصد فرق وزن بنسبة ' || ROUND(_weight_diff * 100, 1) || '% بين الوزن المعلن (' || NEW.quantity || ') والوزن الفعلي (' || NEW.actual_weight || ')',
                NEW.quantity,
                NEW.actual_weight,
                true
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_weight_dispute
AFTER UPDATE OF actual_weight ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.auto_detect_weight_dispute();

-- Enable realtime for chain notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chain_notifications;

-- Indexes
CREATE INDEX idx_driver_assignments_shipment ON public.driver_shipment_assignments(shipment_id);
CREATE INDEX idx_driver_assignments_driver ON public.driver_shipment_assignments(driver_id);
CREATE INDEX idx_driver_assignments_org ON public.driver_shipment_assignments(organization_id);
CREATE INDEX idx_shipment_ratings_shipment ON public.shipment_ratings(shipment_id);
CREATE INDEX idx_shipment_ratings_rated ON public.shipment_ratings(rated_organization_id);
CREATE INDEX idx_shipment_disputes_shipment ON public.shipment_disputes(shipment_id);
CREATE INDEX idx_chain_notifications_target ON public.chain_notifications(target_organization_id, is_read);
CREATE INDEX idx_chain_notifications_shipment ON public.chain_notifications(shipment_id);
CREATE INDEX idx_partner_links_expires ON public.partner_links(expires_at) WHERE expires_at IS NOT NULL;

-- Updated_at triggers
CREATE TRIGGER update_driver_assignments_updated_at BEFORE UPDATE ON public.driver_shipment_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipment_ratings_updated_at BEFORE UPDATE ON public.shipment_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipment_disputes_updated_at BEFORE UPDATE ON public.shipment_disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
