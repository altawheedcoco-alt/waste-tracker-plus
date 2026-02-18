
-- Add data visibility control columns to consultant_organization_assignments
-- Each column controls whether the consultant can see that category of data
ALTER TABLE public.consultant_organization_assignments
  ADD COLUMN can_view_shipments boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_partners boolean NOT NULL DEFAULT false,
  ADD COLUMN can_view_vehicles boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_drivers boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_documents boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_compliance boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_waste_records boolean NOT NULL DEFAULT true,
  ADD COLUMN can_view_incidents boolean NOT NULL DEFAULT true,
  ADD COLUMN hidden_data_notes text,
  ADD COLUMN visibility_updated_at timestamptz DEFAULT now(),
  ADD COLUMN visibility_updated_by uuid;

-- Comment for clarity
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_shipments IS 'السماح بالاطلاع على سجلات الشحنات';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_partners IS 'السماح بالاطلاع على بيانات الشركاء المرتبطين';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_vehicles IS 'السماح بالاطلاع على بيانات المركبات';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_drivers IS 'السماح بالاطلاع على بيانات السائقين';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_documents IS 'السماح بالاطلاع على المستندات والوثائق';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_compliance IS 'السماح بالاطلاع على تقارير الامتثال';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_waste_records IS 'السماح بالاطلاع على سجلات المخلفات';
COMMENT ON COLUMN public.consultant_organization_assignments.can_view_incidents IS 'السماح بالاطلاع على تقارير الحوادث';
