-- Add foreign key for partner_organization_id
ALTER TABLE public.partner_links 
ADD CONSTRAINT partner_links_partner_organization_id_fkey 
FOREIGN KEY (partner_organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add foreign key for organization_id
ALTER TABLE public.partner_links 
ADD CONSTRAINT partner_links_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;