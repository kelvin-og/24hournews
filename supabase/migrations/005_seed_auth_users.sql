-- Migration 005: Create real admin and editor accounts in Supabase Auth
-- Passwords:
-- Super Admin: Admin@2026!
-- Editor: Editor@2026!

DO $$
DECLARE
  superadmin_id uuid := gen_random_uuid();
  editor_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insert Super Admin if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@24hournews.com.gh') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      superadmin_id,
      'authenticated',
      'authenticated',
      'superadmin@24hournews.com.gh',
      crypt('Admin@2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin","role":"super_admin"}',
      now(),
      now(),
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at
    ) VALUES (
      superadmin_id,
      superadmin_id,
      json_build_object('sub', superadmin_id::text, 'email', 'superadmin@24hournews.com.gh'),
      'email',
      superadmin_id::text,
      now(),
      now()
    );
  END IF;

  -- 2. Insert Editor if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'editor@24hournews.com.gh') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      editor_id,
      'authenticated',
      'authenticated',
      'editor@24hournews.com.gh',
      crypt('Editor@2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Ama Osei","role":"editor"}',
      now(),
      now(),
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at
    ) VALUES (
      editor_id,
      editor_id,
      json_build_object('sub', editor_id::text, 'email', 'editor@24hournews.com.gh'),
      'email',
      editor_id::text,
      now(),
      now()
    );
  END IF;
END $$;
