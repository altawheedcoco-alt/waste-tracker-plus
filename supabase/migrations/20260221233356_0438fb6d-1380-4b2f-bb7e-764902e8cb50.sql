-- Remove public read policies that expose content without authentication
DROP POLICY IF EXISTS "Anyone can view org stamps and signatures" ON storage.objects;
DROP POLICY IF EXISTS "Documents are publicly readable" ON storage.objects;
