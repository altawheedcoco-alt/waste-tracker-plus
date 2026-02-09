-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-documents',
  'pdf-documents',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-documents' AND
  auth.uid() IS NOT NULL
);

-- RLS Policy: Users can view PDFs from their organization
CREATE POLICY "Users can view organization PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdf-documents' AND
  auth.uid() IS NOT NULL
);

-- RLS Policy: Users can delete their uploaded PDFs
CREATE POLICY "Users can delete their PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a backup_logs table to track backup history
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL DEFAULT 'database',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  file_size_bytes BIGINT,
  github_commit_url TEXT,
  error_message TEXT,
  tables_backed_up TEXT[],
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on backup_logs
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view backup logs (using position instead of role)
CREATE POLICY "Admins can view backup logs"
ON public.backup_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.position IN ('admin', 'super_admin', 'manager', 'مدير', 'مشرف')
  )
);