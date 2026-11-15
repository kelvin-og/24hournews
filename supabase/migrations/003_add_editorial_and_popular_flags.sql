-- Migration 003: Add Editorial Picks, Most Popular Override, and RLS Admin Policies
-- This enables full persistence for newsroom manual article placement.

-- 1. Add new placement columns to articles table
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_editorial_pick boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_popular_override boolean NOT NULL DEFAULT false;

-- 2. Add indexes for fast homepage queries
CREATE INDEX IF NOT EXISTS idx_articles_editorial_pick
  ON articles (is_editorial_pick)
  WHERE is_editorial_pick = true;

CREATE INDEX IF NOT EXISTS idx_articles_popular_override
  ON articles (is_popular_override)
  WHERE is_popular_override = true;

-- 3. Ensure full CRUD policies for authenticated admin users
-- Allow authenticated staff to insert new articles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'articles' AND policyname = 'Authenticated staff can insert articles'
  ) THEN
    CREATE POLICY "Authenticated staff can insert articles"
      ON articles FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated staff to update articles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'articles' AND policyname = 'Authenticated staff can update articles'
  ) THEN
    CREATE POLICY "Authenticated staff can update articles"
      ON articles FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated staff to delete articles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'articles' AND policyname = 'Authenticated staff can delete articles'
  ) THEN
    CREATE POLICY "Authenticated staff can delete articles"
      ON articles FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 4. Enable RLS on storage.objects for news-images bucket if present
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to news-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access to news-images'
  ) THEN
    CREATE POLICY "Public Access to news-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'news-images');
  END IF;
END $$;

-- Allow authenticated users to upload to news-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload news-images'
  ) THEN
    CREATE POLICY "Authenticated users can upload news-images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'news-images');
  END IF;
END $$;

