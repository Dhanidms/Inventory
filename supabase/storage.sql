-- ============================================================
-- STORAGE SETUP: Create 'item-photos' bucket and policies
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- 1. Create the bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'item-photos' );

-- 3. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'item-photos' );

-- 4. Allow authenticated users to update/overwrite photos
CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'item-photos' );

-- 5. Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'item-photos' );
