-- Migration 004: Admin Newsroom Tables, Persistence & Policies
-- Created: 2026-11-15

-- 1. Ensure authenticated users can view all articles (including drafts & scheduled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'articles' AND policyname = 'articles_authenticated_select'
  ) THEN
    CREATE POLICY "articles_authenticated_select"
      ON articles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 2. Staff Profiles table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'editor')),
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Public read active staff'
  ) THEN
    CREATE POLICY "Public read active staff"
      ON public.staff_profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Authenticated staff can manage staff_profiles'
  ) THEN
    CREATE POLICY "Authenticated staff can manage staff_profiles"
      ON public.staff_profiles FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 3. Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  actor_id text NOT NULL,
  actor_name text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_title text,
  details jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Authenticated staff can read audit_logs'
  ) THEN
    CREATE POLICY "Authenticated staff can read audit_logs"
      ON public.audit_logs FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Authenticated staff can insert audit_logs'
  ) THEN
    CREATE POLICY "Authenticated staff can insert audit_logs"
      ON public.audit_logs FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Media Assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id text PRIMARY KEY,
  filename text NOT NULL,
  url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  caption text DEFAULT '',
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'Public can read media_assets'
  ) THEN
    CREATE POLICY "Public can read media_assets"
      ON public.media_assets FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'Authenticated staff can manage media_assets'
  ) THEN
    CREATE POLICY "Authenticated staff can manage media_assets"
      ON public.media_assets FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Seed initial staff profiles
INSERT INTO public.staff_profiles (id, email, full_name, role, is_active, avatar_url)
VALUES 
  ('user-superadmin-01', 'superadmin@24hournews.com.gh', 'Super Admin', 'super_admin', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
  ('user-editor-01', 'ama.osei@24hournews.com.gh', 'Ama Osei', 'editor', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'),
  ('user-editor-02', 'kofi.asante@24hournews.com.gh', 'Kofi Asante', 'editor', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

