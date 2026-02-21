
-- Add new columns to permits table for enhanced permit system
ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS id_card_front_url text,
  ADD COLUMN IF NOT EXISTS id_card_back_url text,
  ADD COLUMN IF NOT EXISTS license_front_url text,
  ADD COLUMN IF NOT EXISTS license_back_url text,
  ADD COLUMN IF NOT EXISTS person_photo_url text,
  ADD COLUMN IF NOT EXISTS person_phone text,
  ADD COLUMN IF NOT EXISTS person_email text,
  ADD COLUMN IF NOT EXISTS person_address text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS image_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS linked_profile_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS linked_driver_id uuid REFERENCES public.drivers(id),
  ADD COLUMN IF NOT EXISTS parent_permit_id uuid REFERENCES public.permits(id),
  ADD COLUMN IF NOT EXISTS revision_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_reason text,
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS share_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_method text,
  ADD COLUMN IF NOT EXISTS ocr_data jsonb;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_permits_share_token ON public.permits(share_token) WHERE share_token IS NOT NULL;

-- Create index on parent_permit_id for revision chains
CREATE INDEX IF NOT EXISTS idx_permits_parent_id ON public.permits(parent_permit_id) WHERE parent_permit_id IS NOT NULL;

-- Create index on linked_profile_id
CREATE INDEX IF NOT EXISTS idx_permits_linked_profile ON public.permits(linked_profile_id) WHERE linked_profile_id IS NOT NULL;

-- Create index on linked_driver_id
CREATE INDEX IF NOT EXISTS idx_permits_linked_driver ON public.permits(linked_driver_id) WHERE linked_driver_id IS NOT NULL;

-- Create a permit images archive table
CREATE TABLE IF NOT EXISTS public.permit_document_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  uploaded_by uuid REFERENCES public.profiles(id),
  image_type text NOT NULL, -- 'id_card_front', 'id_card_back', 'license_front', 'license_back'
  image_url text NOT NULL,
  person_name text,
  document_number text,
  ocr_extracted_data jsonb,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.permit_document_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org images" ON public.permit_document_images
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert images for their org" ON public.permit_document_images
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their org images" ON public.permit_document_images
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their org images" ON public.permit_document_images
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Function to generate a share token for a permit
CREATE OR REPLACE FUNCTION public.generate_permit_share_token(permit_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  p_valid_until timestamptz;
BEGIN
  token := encode(gen_random_bytes(32), 'hex');
  
  SELECT valid_until INTO p_valid_until FROM permits WHERE id = permit_id;
  
  UPDATE permits 
  SET share_token = token,
      share_token_expires_at = COALESCE(p_valid_until, now() + interval '30 days')
  WHERE id = permit_id;
  
  RETURN token;
END;
$$;

-- Function to create a permit revision (new version)
CREATE OR REPLACE FUNCTION public.create_permit_revision(
  original_permit_id uuid,
  p_revision_reason text DEFAULT 'تعديل بيانات'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  old_permit permits%ROWTYPE;
  new_number text;
  next_rev integer;
BEGIN
  SELECT * INTO old_permit FROM permits WHERE id = original_permit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permit not found';
  END IF;
  
  -- Get max revision for this chain
  SELECT COALESCE(MAX(revision_number), old_permit.revision_number) + 1 
  INTO next_rev 
  FROM permits 
  WHERE parent_permit_id = COALESCE(old_permit.parent_permit_id, old_permit.id)
     OR id = COALESCE(old_permit.parent_permit_id, old_permit.id);
  
  new_id := gen_random_uuid();
  new_number := '';
  
  INSERT INTO permits (
    id, permit_number, permit_type, status, issuer_organization_id,
    shipment_id, person_name, person_id_number, person_role, driver_id,
    vehicle_plate, waste_type, waste_description, estimated_quantity,
    quantity_unit, valid_from, valid_until, purpose, notes,
    special_instructions, created_by, organization_id,
    id_card_front_url, id_card_back_url, license_front_url, license_back_url,
    person_photo_url, person_phone, person_email, person_address,
    license_number, license_expiry, vehicle_type, image_source,
    linked_profile_id, linked_driver_id,
    parent_permit_id, revision_number, revision_reason
  ) VALUES (
    new_id, new_number, old_permit.permit_type, 'draft', old_permit.issuer_organization_id,
    old_permit.shipment_id, old_permit.person_name, old_permit.person_id_number, old_permit.person_role, old_permit.driver_id,
    old_permit.vehicle_plate, old_permit.waste_type, old_permit.waste_description, old_permit.estimated_quantity,
    old_permit.quantity_unit, old_permit.valid_from, old_permit.valid_until, old_permit.purpose, old_permit.notes,
    old_permit.special_instructions, old_permit.created_by, old_permit.organization_id,
    old_permit.id_card_front_url, old_permit.id_card_back_url, old_permit.license_front_url, old_permit.license_back_url,
    old_permit.person_photo_url, old_permit.person_phone, old_permit.person_email, old_permit.person_address,
    old_permit.license_number, old_permit.license_expiry, old_permit.vehicle_type, old_permit.image_source,
    old_permit.linked_profile_id, old_permit.linked_driver_id,
    COALESCE(old_permit.parent_permit_id, old_permit.id), next_rev, p_revision_reason
  );
  
  -- Archive the old permit
  UPDATE permits SET status = 'superseded' WHERE id = original_permit_id AND status != 'superseded';
  
  RETURN new_id;
END;
$$;
