-- ============================================================================
-- Registration Fallback & Admin Approval Migration (Non-Destructive & Idempotent)
-- Purpose:
--   When Supabase Auth email quota / rate limit (429) is exhausted or email
--   verification links cannot be delivered, new aspirants are still registered
--   into an Admin Approval Queue (with bcrypt-hashed passwords).
--   Once an Admin approves a request, the user's Supabase Auth account is
--   created / confirmed immediately (email_confirmed_at = now()) so they can
--   sign in right away without needing email verification.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Pending Registrations Queue Table (Strictly locked down — RPC access only)
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) > 0),
  password_hash text NOT NULL DEFAULT '',
  target_air integer NOT NULL DEFAULT 1,
  target_college text NOT NULL DEFAULT 'IISc Bangalore (M.Tech AI)',
  source_reason text NOT NULL DEFAULT 'rate_limit_fallback'
    CHECK (source_reason IN ('rate_limit_fallback', 'email_unconfirmed', 'manual_request')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  approved_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_status_created
  ON public.pending_registrations (status, created_at DESC);

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Never allow direct table reads/writes from anon or authenticated (protects password_hash)
REVOKE ALL ON public.pending_registrations FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2. Public RPC: Submit a Fallback Registration for Admin Approval
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_pending_registration(
  p_email text,
  p_password text,
  p_full_name text,
  p_target_air integer DEFAULT 1,
  p_target_college text DEFAULT 'IISc Bangalore (M.Tech AI)',
  p_source_reason text DEFAULT 'rate_limit_fallback'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_college text;
  v_air integer;
  v_reason text;
  v_existing_auth_id uuid;
  v_existing_confirmed timestamptz;
  v_password_hash text := '';
  v_request_id uuid;
BEGIN
  v_email := lower(btrim(COALESCE(p_email, '')));
  v_full_name := btrim(COALESCE(p_full_name, ''));
  v_college := COALESCE(NULLIF(btrim(COALESCE(p_target_college, '')), ''), 'IISc Bangalore (M.Tech AI)');
  v_air := GREATEST(1, LEAST(10000, COALESCE(p_target_air, 1)));
  v_reason := CASE
    WHEN p_source_reason IN ('rate_limit_fallback', 'email_unconfirmed', 'manual_request')
      THEN p_source_reason
    ELSE 'rate_limit_fallback'
  END;

  IF v_email = '' OR position('@' IN v_email) < 2 OR position('.' IN split_part(v_email, '@', 2)) < 2 THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;

  -- Check if this email already exists in Supabase Auth
  SELECT u.id, u.email_confirmed_at
  INTO v_existing_auth_id, v_existing_confirmed
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_existing_auth_id IS NOT NULL AND v_existing_confirmed IS NOT NULL THEN
    RAISE EXCEPTION 'An account with this email already exists. Please sign in instead.';
  END IF;

  -- If user doesn't exist in auth.users yet, password & name are strictly required
  IF v_existing_auth_id IS NULL THEN
    IF v_full_name = '' THEN
      RAISE EXCEPTION 'Full name is required.';
    END IF;
    IF p_password IS NULL OR char_length(p_password) < 6 THEN
      RAISE EXCEPTION 'Password must be at least 6 characters long.';
    END IF;
    v_password_hash := crypt(p_password, gen_salt('bf', 10));
  ELSE
    -- Unconfirmed auth.users account already exists; keep existing name if omitted
    IF v_full_name = '' THEN
      SELECT COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(v_email, '@', 1))
      INTO v_full_name
      FROM auth.users u
      WHERE u.id = v_existing_auth_id;
    END IF;
    IF p_password IS NOT NULL AND char_length(p_password) >= 6 THEN
      v_password_hash := crypt(p_password, gen_salt('bf', 10));
    END IF;
    v_reason := 'email_unconfirmed';
  END IF;

  INSERT INTO public.pending_registrations (
    email,
    full_name,
    password_hash,
    target_air,
    target_college,
    source_reason,
    status,
    reviewed_by,
    reviewed_at,
    rejection_reason,
    approved_user_id,
    updated_at
  )
  VALUES (
    v_email,
    v_full_name,
    v_password_hash,
    v_air,
    v_college,
    v_reason,
    'pending',
    NULL,
    NULL,
    NULL,
    NULL,
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    password_hash = CASE
      WHEN EXCLUDED.password_hash <> '' THEN EXCLUDED.password_hash
      ELSE public.pending_registrations.password_hash
    END,
    target_air = EXCLUDED.target_air,
    target_college = EXCLUDED.target_college,
    source_reason = EXCLUDED.source_reason,
    status = 'pending',
    reviewed_by = NULL,
    reviewed_at = NULL,
    rejection_reason = NULL,
    updated_at = now()
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'email', v_email,
    'status', 'pending'
  );
END;
$$;

-- ============================================================================
-- 3. Public RPC: Check Pending Approval Status (for clear login feedback)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_pending_registration_status(p_email text)
RETURNS TABLE (
  status text,
  rejection_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(COALESCE(p_email, '')));
  v_row RECORD;
  v_unconfirmed boolean := false;
BEGIN
  IF v_email = '' THEN
    RETURN QUERY SELECT 'none'::text, NULL::text;
    RETURN;
  END IF;

  SELECT pr.status, pr.rejection_reason
  INTO v_row
  FROM public.pending_registrations pr
  WHERE pr.email = v_email
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_row.status, v_row.rejection_reason;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = v_email
      AND u.email_confirmed_at IS NULL
  ) INTO v_unconfirmed;

  IF v_unconfirmed THEN
    RETURN QUERY SELECT 'unconfirmed'::text, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'none'::text, NULL::text;
END;
$$;

-- ============================================================================
-- 4. Admin RPC: List All Pending Registration Requests + Unconfirmed Users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_list_pending_registrations()
RETURNS TABLE (
  id uuid,
  kind text,
  email text,
  full_name text,
  target_air integer,
  target_college text,
  source_reason text,
  status text,
  rejection_reason text,
  created_at timestamptz,
  reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view registration approval requests.';
  END IF;

  RETURN QUERY
  SELECT *
  FROM (
    SELECT
      pr.id,
      'fallback_request'::text AS kind,
      pr.email,
      pr.full_name,
      pr.target_air,
      pr.target_college,
      pr.source_reason,
      pr.status,
      pr.rejection_reason,
      pr.created_at,
      pr.reviewed_at
    FROM public.pending_registrations pr

    UNION ALL

    SELECT
      u.id,
      'unconfirmed_auth_user'::text AS kind,
      lower(u.email)::text AS email,
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))::text AS full_name,
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'target_air', '')::integer, 1) AS target_air,
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'target_college', ''), 'IISc Bangalore (M.Tech AI)')::text AS target_college,
      'email_unconfirmed'::text AS source_reason,
      'pending'::text AS status,
      NULL::text AS rejection_reason,
      u.created_at,
      NULL::timestamptz AS reviewed_at
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.pending_registrations pr2
        WHERE pr2.email = lower(u.email)
          AND pr2.status = 'pending'
      )
  ) combined
  ORDER BY
    CASE combined.status
      WHEN 'pending' THEN 0
      WHEN 'rejected' THEN 1
      ELSE 2
    END,
    combined.created_at DESC;
END;
$$;

-- ============================================================================
-- 5. Admin RPC: Approve Request & Activate Account Without Email Verification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_approve_pending_registration(
  p_request_id uuid,
  p_kind text DEFAULT 'fallback_request'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_req public.pending_registrations%ROWTYPE;
  v_existing_user_id uuid;
  v_new_user_id uuid;
  v_instance_id uuid;
  v_email text;
  v_full_name text;
  v_meta jsonb;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can approve registration requests.';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required.';
  END IF;

  -- Case A: Directly confirm an existing unconfirmed auth.users account
  IF p_kind = 'unconfirmed_auth_user' THEN
    SELECT
      u.id,
      lower(u.email),
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
    INTO v_existing_user_id, v_email, v_full_name
    FROM auth.users u
    WHERE u.id = p_request_id;

    IF v_existing_user_id IS NULL THEN
      RAISE EXCEPTION 'Unconfirmed user account not found.';
    END IF;

    UPDATE auth.users
    SET
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'email_verified', true,
        'approved_by_admin', true
      ),
      updated_at = now()
    WHERE id = v_existing_user_id;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_existing_user_id, v_full_name, 'student')
    ON CONFLICT (id) DO UPDATE
      SET full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
          updated_at = now();

    INSERT INTO public.chat_profiles (user_id)
    VALUES (v_existing_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES ('gate-study', v_existing_user_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    UPDATE public.pending_registrations
    SET
      status = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      approved_user_id = v_existing_user_id,
      rejection_reason = NULL,
      updated_at = now()
    WHERE email = v_email;

    RETURN jsonb_build_object(
      'user_id', v_existing_user_id,
      'email', v_email,
      'full_name', v_full_name
    );
  END IF;

  -- Case B: Approve a fallback registration request from public.pending_registrations
  SELECT * INTO v_req
  FROM public.pending_registrations
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending registration request not found.';
  END IF;

  IF v_req.status = 'approved' AND v_req.approved_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'user_id', v_req.approved_user_id,
      'email', v_req.email,
      'full_name', v_req.full_name
    );
  END IF;

  v_meta := jsonb_build_object(
    'full_name', v_req.full_name,
    'target_air', v_req.target_air,
    'target_college', v_req.target_college,
    'email', v_req.email,
    'email_verified', true,
    'approved_by_admin', true
  );

  SELECT u.id INTO v_existing_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_req.email
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    -- Confirm existing auth user (and apply hashed password if supplied)
    v_new_user_id := v_existing_user_id;

    UPDATE auth.users
    SET
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      encrypted_password = CASE
        WHEN v_req.password_hash IS NOT NULL AND v_req.password_hash <> '' THEN v_req.password_hash
        ELSE encrypted_password
      END,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || v_meta,
      updated_at = now()
    WHERE id = v_new_user_id;
  ELSE
    -- Create brand-new pre-confirmed Supabase Auth user directly (bypasses SMTP rate limit)
    IF v_req.password_hash IS NULL OR v_req.password_hash = '' THEN
      RAISE EXCEPTION 'Cannot create account because password hash is missing.';
    END IF;

    SELECT COALESCE(
      (SELECT u.instance_id FROM auth.users u LIMIT 1),
      '00000000-0000-0000-0000-000000000000'::uuid
    ) INTO v_instance_id;

    v_new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      v_instance_id,
      v_new_user_id,
      'authenticated',
      'authenticated',
      v_req.email,
      v_req.password_hash,
      now(),
      '',
      '',
      '',
      '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      v_meta,
      now(),
      now()
    );
  END IF;

  -- Ensure email identity exists in auth.identities for GoTrue password sign-in
  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = v_new_user_id
      AND i.provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_new_user_id,
      v_new_user_id::text,
      jsonb_build_object(
        'sub', v_new_user_id::text,
        'email', v_req.email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ensure public profile & chat membership are initialized cleanly
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (v_new_user_id, v_req.full_name, 'student')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        updated_at = now();

  INSERT INTO public.chat_profiles (user_id)
  VALUES (v_new_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.chat_group_members (group_id, user_id)
  VALUES ('gate-study', v_new_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  UPDATE public.pending_registrations
  SET
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    approved_user_id = v_new_user_id,
    rejection_reason = NULL,
    updated_at = now()
  WHERE id = v_req.id;

  RETURN jsonb_build_object(
    'user_id', v_new_user_id,
    'email', v_req.email,
    'full_name', v_req.full_name
  );
END;
$$;

-- ============================================================================
-- 6. Admin RPC: Reject a Pending Registration Request
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_reject_pending_registration(
  p_request_id uuid,
  p_reason text DEFAULT NULL,
  p_kind text DEFAULT 'fallback_request'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_clean_reason text := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_email text;
  v_full_name text;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can reject registration requests.';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required.';
  END IF;

  IF p_kind = 'unconfirmed_auth_user' THEN
    SELECT
      lower(u.email),
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
    INTO v_email, v_full_name
    FROM auth.users u
    WHERE u.id = p_request_id;

    IF v_email IS NULL THEN
      RAISE EXCEPTION 'Unconfirmed user account not found.';
    END IF;

    INSERT INTO public.pending_registrations (
      email,
      full_name,
      password_hash,
      source_reason,
      status,
      reviewed_by,
      reviewed_at,
      rejection_reason,
      updated_at
    )
    VALUES (
      v_email,
      v_full_name,
      '',
      'email_unconfirmed',
      'rejected',
      v_admin_id,
      now(),
      v_clean_reason,
      now()
    )
    ON CONFLICT (email) DO UPDATE
    SET
      status = 'rejected',
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      rejection_reason = v_clean_reason,
      updated_at = now();

    -- Remove the unconfirmed auth.users account so it cannot verify later
    DELETE FROM auth.users
    WHERE id = p_request_id
      AND email_confirmed_at IS NULL;

    RETURN;
  END IF;

  UPDATE public.pending_registrations
  SET
    status = 'rejected',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    rejection_reason = v_clean_reason,
    updated_at = now()
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending registration request not found.';
  END IF;
END;
$$;

-- ============================================================================
-- 7. Permissions & Schema Cache Reload
-- ============================================================================
REVOKE ALL ON FUNCTION public.submit_pending_registration(text, text, text, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_pending_registration_status(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_pending_registrations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_approve_pending_registration(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_pending_registration(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_pending_registration(text, text, text, integer, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_pending_registration_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_registrations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_pending_registration(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_pending_registration(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
