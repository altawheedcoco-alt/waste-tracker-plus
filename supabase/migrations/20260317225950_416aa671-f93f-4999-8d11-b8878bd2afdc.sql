ALTER TABLE public.terms_acceptances 
ADD COLUMN IF NOT EXISTS business_doc_extracted_data jsonb DEFAULT NULL;