-- Drop the existing check constraint and add a new one that includes 'guest'
ALTER TABLE public.external_partners 
DROP CONSTRAINT IF EXISTS external_partners_partner_type_check;

ALTER TABLE public.external_partners 
ADD CONSTRAINT external_partners_partner_type_check 
CHECK (partner_type IN ('generator', 'recycler', 'guest'));