
-- Make all sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN (
  'organization-stamps',
  'entity-documents',
  'employee-files',
  'pdf-documents',
  'weighbridge-photos',
  'rating-evidence'
);
