-- Make organization-documents bucket public so chat files can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'organization-documents';