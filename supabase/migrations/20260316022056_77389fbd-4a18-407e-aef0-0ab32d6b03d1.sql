
ALTER TABLE public.shipment_movement_supervisors 
  ADD COLUMN IF NOT EXISTS auto_sign_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sign_method TEXT DEFAULT 'manual' CHECK (auto_sign_method IN ('manual', 'otp', 'national_id', 'digital_stamp', 'full_auto')),
  ALTER COLUMN organization_id DROP NOT NULL;

ALTER TABLE public.organization_movement_supervisors 
  ADD COLUMN IF NOT EXISTS auto_sign_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sign_method TEXT DEFAULT 'manual' CHECK (auto_sign_method IN ('manual', 'otp', 'national_id', 'digital_stamp', 'full_auto'));
