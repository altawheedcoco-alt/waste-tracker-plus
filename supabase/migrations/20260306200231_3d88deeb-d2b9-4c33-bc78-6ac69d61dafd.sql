
-- Auto-generate digital_declaration_number for organizations on insert
CREATE OR REPLACE FUNCTION public.auto_generate_org_verification_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_prefix TEXT;
  year_month TEXT;
  rand_code TEXT;
  decl_num TEXT;
BEGIN
  -- Only generate if not already set
  IF NEW.digital_declaration_number IS NULL OR NEW.digital_declaration_number = '' THEN
    -- Determine prefix based on org type
    CASE NEW.organization_type
      WHEN 'generator' THEN org_prefix := 'GEN';
      WHEN 'transporter' THEN org_prefix := 'TRN';
      WHEN 'recycler' THEN org_prefix := 'RCY';
      WHEN 'disposal' THEN org_prefix := 'DSP';
      WHEN 'consultant' THEN org_prefix := 'CON';
      WHEN 'consulting_office' THEN org_prefix := 'COF';
      WHEN 'regulator' THEN org_prefix := 'REG';
      WHEN 'iso_body' THEN org_prefix := 'ISO';
      WHEN 'driver' THEN org_prefix := 'DRV';
      WHEN 'admin' THEN org_prefix := 'ADM';
      ELSE org_prefix := 'ORG';
    END CASE;

    year_month := to_char(NOW(), 'YYMM');
    rand_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    decl_num := org_prefix || '-' || year_month || '-' || rand_code;

    NEW.digital_declaration_number := decl_num;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists then create trigger
DROP TRIGGER IF EXISTS trg_auto_org_verification_identity ON public.organizations;
CREATE TRIGGER trg_auto_org_verification_identity
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_org_verification_identity();

-- Backfill existing organizations that don't have a digital_declaration_number
UPDATE public.organizations
SET digital_declaration_number = 
  CASE organization_type::text
    WHEN 'generator' THEN 'GEN'
    WHEN 'transporter' THEN 'TRN'
    WHEN 'recycler' THEN 'RCY'
    WHEN 'disposal' THEN 'DSP'
    WHEN 'consultant' THEN 'CON'
    WHEN 'consulting_office' THEN 'COF'
    WHEN 'regulator' THEN 'REG'
    WHEN 'iso_body' THEN 'ISO'
    WHEN 'driver' THEN 'DRV'
    WHEN 'admin' THEN 'ADM'
    ELSE 'ORG'
  END
  || '-' || to_char(created_at, 'YYMM')
  || '-' || upper(substr(md5(id::text), 1, 6))
WHERE digital_declaration_number IS NULL OR digital_declaration_number = '';
