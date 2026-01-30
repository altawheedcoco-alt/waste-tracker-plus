-- Add client_code column to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS client_code text UNIQUE;

-- Create function to generate unique client code
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix text;
  new_code text;
  code_exists boolean;
BEGIN
  -- Set prefix based on organization type
  CASE NEW.organization_type
    WHEN 'generator' THEN prefix := 'GEN';
    WHEN 'transporter' THEN prefix := 'TRP';
    WHEN 'recycler' THEN prefix := 'RCY';
    ELSE prefix := 'ORG';
  END CASE;
  
  -- Generate unique code with format: PREFIX-YYYYMM-XXXX
  LOOP
    new_code := prefix || '-' || TO_CHAR(now(), 'YYMM') || '-' || 
                LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM organizations WHERE client_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.client_code := new_code;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate client code on insert
DROP TRIGGER IF EXISTS generate_organization_client_code ON public.organizations;
CREATE TRIGGER generate_organization_client_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION public.generate_client_code();

-- Generate codes for existing organizations that don't have one
DO $$
DECLARE
  org RECORD;
  prefix text;
  new_code text;
  code_exists boolean;
BEGIN
  FOR org IN SELECT id, organization_type FROM organizations WHERE client_code IS NULL
  LOOP
    -- Set prefix based on organization type
    CASE org.organization_type
      WHEN 'generator' THEN prefix := 'GEN';
      WHEN 'transporter' THEN prefix := 'TRP';
      WHEN 'recycler' THEN prefix := 'RCY';
      ELSE prefix := 'ORG';
    END CASE;
    
    -- Generate unique code
    LOOP
      new_code := prefix || '-' || TO_CHAR(now(), 'YYMM') || '-' || 
                  LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
      
      SELECT EXISTS(SELECT 1 FROM organizations WHERE client_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE organizations SET client_code = new_code WHERE id = org.id;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN public.organizations.client_code IS 'كود العميل المميز - يتم إنشاؤه تلقائياً';