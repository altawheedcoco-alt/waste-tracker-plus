
-- Auto-generate digital_declaration_number on organization insert
CREATE OR REPLACE FUNCTION public.generate_digital_declaration_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INT;
  new_number TEXT;
BEGIN
  CASE NEW.organization_type::text
    WHEN 'generator' THEN prefix := 'GEN';
    WHEN 'recycler' THEN prefix := 'RCY';
    WHEN 'transporter' THEN prefix := 'TRN';
    WHEN 'transport_office' THEN prefix := 'TOF';
    WHEN 'disposal' THEN prefix := 'DSP';
    WHEN 'consultant' THEN prefix := 'CNS';
    WHEN 'consulting_office' THEN prefix := 'COF';
    WHEN 'iso_body' THEN prefix := 'ISO';
    WHEN 'regulator' THEN prefix := 'REG';
    ELSE prefix := 'ORG';
  END CASE;

  SELECT COUNT(*) + 1 INTO seq_num
  FROM organizations
  WHERE organization_type = NEW.organization_type
    AND digital_declaration_number IS NOT NULL;

  new_number := prefix || '-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq_num::TEXT, 5, '0');

  IF NEW.digital_declaration_number IS NULL OR NEW.digital_declaration_number = '' THEN
    NEW.digital_declaration_number := new_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_digital_declaration_number ON public.organizations;

CREATE TRIGGER trg_auto_digital_declaration_number
BEFORE INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.generate_digital_declaration_number();

-- Backfill existing orgs that don't have a number yet
WITH numbered AS (
  SELECT id, organization_type, created_at,
    ROW_NUMBER() OVER (PARTITION BY organization_type ORDER BY created_at) as rn
  FROM organizations
  WHERE digital_declaration_number IS NULL OR digital_declaration_number = ''
)
UPDATE organizations o
SET digital_declaration_number = 
  CASE n.organization_type::text
    WHEN 'generator' THEN 'GEN'
    WHEN 'recycler' THEN 'RCY'
    WHEN 'transporter' THEN 'TRN'
    WHEN 'transport_office' THEN 'TOF'
    WHEN 'disposal' THEN 'DSP'
    WHEN 'consultant' THEN 'CNS'
    WHEN 'consulting_office' THEN 'COF'
    WHEN 'iso_body' THEN 'ISO'
    WHEN 'regulator' THEN 'REG'
    ELSE 'ORG'
  END || '-' || EXTRACT(YEAR FROM n.created_at)::TEXT || '-' || LPAD(n.rn::TEXT, 5, '0')
FROM numbered n
WHERE o.id = n.id;
