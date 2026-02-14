
-- 1. جدول أعضاء المنظمة (Organization Members) - ربط المستخدم بالمنصب والقسم
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id),
    position_id UUID REFERENCES public.organization_positions(id),
    department_id UUID REFERENCES public.organization_departments(id),
    employee_number TEXT,
    job_title TEXT,
    job_title_ar TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'on_leave', 'pending_invitation')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES public.profiles(id),
    invitation_email TEXT,
    invitation_token TEXT,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org members"
ON public.organization_members FOR SELECT
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Admins can manage org members"
ON public.organization_members FOR INSERT
WITH CHECK (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Admins can update org members"
ON public.organization_members FOR UPDATE
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Admins can delete org members"
ON public.organization_members FOR DELETE
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

-- 2. جدول صلاحيات المناصب التفصيلية
CREATE TABLE public.position_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES public.organization_positions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- صلاحيات الشحنات
    can_create_shipments BOOLEAN DEFAULT false,
    can_edit_shipments BOOLEAN DEFAULT false,
    can_delete_shipments BOOLEAN DEFAULT false,
    can_approve_shipments BOOLEAN DEFAULT false,
    can_change_status BOOLEAN DEFAULT false,
    -- صلاحيات مالية
    can_view_financials BOOLEAN DEFAULT false,
    can_create_invoices BOOLEAN DEFAULT false,
    can_approve_payments BOOLEAN DEFAULT false,
    can_manage_deposits BOOLEAN DEFAULT false,
    -- صلاحيات السائقين
    can_manage_drivers BOOLEAN DEFAULT false,
    can_assign_drivers BOOLEAN DEFAULT false,
    can_track_vehicles BOOLEAN DEFAULT false,
    -- صلاحيات إدارية
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_settings BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    can_manage_contracts BOOLEAN DEFAULT false,
    -- صلاحيات الشركاء
    can_manage_partners BOOLEAN DEFAULT false,
    can_view_partner_data BOOLEAN DEFAULT false,
    -- صلاحيات المستندات
    can_sign_documents BOOLEAN DEFAULT false,
    can_issue_certificates BOOLEAN DEFAULT false,
    can_manage_templates BOOLEAN DEFAULT false,
    -- صلاحيات مخصصة
    custom_permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(position_id)
);

ALTER TABLE public.position_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view position permissions"
ON public.position_permissions FOR SELECT
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Admins can manage position permissions"
ON public.position_permissions FOR INSERT
WITH CHECK (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

CREATE POLICY "Admins can update position permissions"
ON public.position_permissions FOR UPDATE
USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
));

-- 3. دالة للتحقق من صلاحية المستخدم عبر منصبه
CREATE OR REPLACE FUNCTION public.check_position_permission(
    _user_id UUID,
    _org_id UUID,
    _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _has_permission BOOLEAN := false;
BEGIN
    SELECT 
        CASE _permission
            WHEN 'create_shipments' THEN pp.can_create_shipments
            WHEN 'edit_shipments' THEN pp.can_edit_shipments
            WHEN 'delete_shipments' THEN pp.can_delete_shipments
            WHEN 'approve_shipments' THEN pp.can_approve_shipments
            WHEN 'change_status' THEN pp.can_change_status
            WHEN 'view_financials' THEN pp.can_view_financials
            WHEN 'create_invoices' THEN pp.can_create_invoices
            WHEN 'approve_payments' THEN pp.can_approve_payments
            WHEN 'manage_deposits' THEN pp.can_manage_deposits
            WHEN 'manage_drivers' THEN pp.can_manage_drivers
            WHEN 'assign_drivers' THEN pp.can_assign_drivers
            WHEN 'track_vehicles' THEN pp.can_track_vehicles
            WHEN 'manage_users' THEN pp.can_manage_users
            WHEN 'manage_settings' THEN pp.can_manage_settings
            WHEN 'view_reports' THEN pp.can_view_reports
            WHEN 'export_data' THEN pp.can_export_data
            WHEN 'manage_contracts' THEN pp.can_manage_contracts
            WHEN 'manage_partners' THEN pp.can_manage_partners
            WHEN 'view_partner_data' THEN pp.can_view_partner_data
            WHEN 'sign_documents' THEN pp.can_sign_documents
            WHEN 'issue_certificates' THEN pp.can_issue_certificates
            WHEN 'manage_templates' THEN pp.can_manage_templates
            ELSE false
        END INTO _has_permission
    FROM organization_members om
    JOIN position_permissions pp ON pp.position_id = om.position_id
    WHERE om.user_id = _user_id
      AND om.organization_id = _org_id
      AND om.status = 'active';

    -- company_admin always has all permissions
    IF NOT COALESCE(_has_permission, false) THEN
        SELECT EXISTS(
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = _user_id AND ur.role = 'company_admin'
        ) INTO _has_permission;
    END IF;

    RETURN COALESCE(_has_permission, false);
END;
$$;

-- 4. تريجر لتحديث organization_positions عند تعيين عضو
CREATE OR REPLACE FUNCTION public.sync_member_to_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When a member is assigned a position, update the position's assigned_user_id
    IF NEW.position_id IS NOT NULL THEN
        UPDATE organization_positions 
        SET assigned_user_id = NEW.profile_id
        WHERE id = NEW.position_id;
    END IF;
    
    -- If position changed, clear old position
    IF OLD IS NOT NULL AND OLD.position_id IS NOT NULL AND OLD.position_id != NEW.position_id THEN
        UPDATE organization_positions 
        SET assigned_user_id = NULL
        WHERE id = OLD.position_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_member_position
AFTER INSERT OR UPDATE OF position_id ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_member_to_position();

-- 5. تريجر إنشاء صلاحيات افتراضية عند إنشاء منصب
CREATE OR REPLACE FUNCTION public.create_default_position_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO position_permissions (position_id, organization_id,
        can_create_shipments, can_edit_shipments, can_view_financials, 
        can_view_reports, can_manage_drivers, can_assign_drivers,
        can_track_vehicles, can_manage_users, can_manage_settings,
        can_sign_documents, can_manage_partners)
    VALUES (NEW.id, NEW.organization_id,
        NEW.level >= 2, -- managers can create shipments
        NEW.level >= 1, -- supervisors can edit
        NEW.level >= 3, -- senior managers see financials
        NEW.level >= 2, -- managers see reports
        NEW.level >= 2, -- managers manage drivers
        NEW.level >= 1, -- supervisors assign drivers
        true, -- everyone can track
        NEW.level >= 3, -- senior manage users
        NEW.level >= 4, -- executives manage settings
        NEW.level >= 2, -- managers sign docs
        NEW.level >= 3  -- senior manage partners
    )
    ON CONFLICT (position_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_default_position_permissions
AFTER INSERT ON public.organization_positions
FOR EACH ROW
EXECUTE FUNCTION public.create_default_position_permissions();

-- Indexes
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_position ON public.organization_members(position_id);
CREATE INDEX idx_position_permissions_position ON public.position_permissions(position_id);
CREATE INDEX idx_position_permissions_org ON public.position_permissions(organization_id);

-- Updated_at triggers
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_position_permissions_updated_at BEFORE UPDATE ON public.position_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
