
-- رفع حد حجم الملفات لجميع الـ buckets إلى 100MB للسماح بتحميل الفيديوهات بحجمها الطبيعي
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id IN (
  'organization-posts',
  'post-images',
  'profile-media',
  'shipment-videos',
  'shipment-photos',
  'shipment-documents',
  'organization-documents',
  'entity-documents',
  'chat-wallpapers',
  'stories',
  'c2b-photos',
  'public-assets',
  'system-screenshots',
  'shared-documents',
  'pdf-documents',
  'document-archive',
  'employee-files',
  'signing-documents',
  'recycling-certificates',
  'rating-evidence',
  'payment-receipts',
  'deposit-receipts',
  'id-cards',
  'organization-stamps',
  'weighbridge-photos'
);
