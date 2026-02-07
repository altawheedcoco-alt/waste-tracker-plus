
-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_entity_document_search()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_text := to_tsvector('arabic', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.reference_number, '') || ' ' ||
    COALESCE(NEW.file_name, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
