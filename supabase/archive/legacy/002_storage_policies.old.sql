-- ============================================================
-- School Connect — Storage Bucket Policies
-- Run this AFTER creating buckets in Supabase dashboard
-- Buckets to create:
--   school-assets   (public)
--   post-images     (public)
--   post-documents  (private)
-- ============================================================

-- school-assets: public read, authenticated write
CREATE POLICY "school_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-assets');

CREATE POLICY "school_assets_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-assets' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "school_assets_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'school-assets' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- post-images: public read, school write
CREATE POLICY "post_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "post_images_school_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid() IS NOT NULL
  );

-- post-documents: authenticated read only for school members, school write
CREATE POLICY "post_documents_auth_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'post-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "post_documents_school_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-documents' AND
    auth.uid() IS NOT NULL
  );
