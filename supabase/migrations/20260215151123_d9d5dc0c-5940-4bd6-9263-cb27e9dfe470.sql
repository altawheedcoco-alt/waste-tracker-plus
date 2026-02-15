-- Add description column to document_print_log for AI-generated summaries
ALTER TABLE public.document_print_log 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS document_category text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS ai_summary text;
