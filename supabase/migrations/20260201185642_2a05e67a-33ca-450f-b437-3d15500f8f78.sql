-- Create terms acceptance tracking table
CREATE TABLE public.terms_acceptances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    organization_type TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    terms_version TEXT NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own acceptances
CREATE POLICY "Users can view their own terms acceptances"
ON public.terms_acceptances
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own acceptances
CREATE POLICY "Users can insert their own terms acceptances"
ON public.terms_acceptances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all acceptances
CREATE POLICY "Admins can view all terms acceptances"
ON public.terms_acceptances
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Create index for faster lookups
CREATE INDEX idx_terms_acceptances_user_org ON public.terms_acceptances(user_id, organization_id);
CREATE INDEX idx_terms_acceptances_version ON public.terms_acceptances(terms_version);