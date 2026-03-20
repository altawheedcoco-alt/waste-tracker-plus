-- Add OCR/AI extracted data columns to entity_documents
ALTER TABLE public.entity_documents 
ADD COLUMN IF NOT EXISTS ocr_extracted_data jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ocr_confidence numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_extracted boolean DEFAULT false;

-- Add index for AI-extracted documents
CREATE INDEX IF NOT EXISTS idx_entity_documents_ai_extracted 
ON public.entity_documents (organization_id, ai_extracted) 
WHERE ai_extracted = true;