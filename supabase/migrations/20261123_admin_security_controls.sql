-- ============================================================================
-- Admin Security Controls Migration (Non-Destructive & Idempotent)
-- 1. Admin-only test deletion (strictly blocked once any user attempts a test)
-- 2. Admin user blocking / unblocking (blocks login & active sessions)
-- 3. Admin chat moderation (delete any study group or direct message)
-- ============================================================================

-- 1. User Blocking Columns on public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason text;

CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked
  ON public.profiles (is_blocked)
  WHERE is_blocked = true;

-- Helper: Check if the currently authenticated user is blocked
CREATE OR REPLACE FUNCTION public.check_my_block_status()
RETURNS TABLE (
  is_blocked boolean,
  blocked_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT COALESCE(p.is_blocked, false), p.blocked_reason
  FROM public.profiles p
  WHERE p.id = v_uid
  LIMIT 1;
END;
$$;

-- Admin RPC: Block or unblock a user account
CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_target_user_id uuid,
  p_blocked boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_target_role text;
  v_clean_reason text;
BEGIN
  IF v_actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can block or unblock users.';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required.';
  END IF;

  IF p_target_user_id = v_actor_id THEN
    RAISE EXCEPTION 'Administrators cannot block their own account.';
  END IF;

  SELECT p.role INTO v_target_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  IF p_blocked AND v_target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot block another administrator account. Demote their role first.';
  END IF;

  v_clean_reason := NULLIF(btrim(COALESCE(p_reason, '')), '');

  UPDATE public.profiles
  SET
    is_blocked = p_blocked,
    blocked_at = CASE WHEN p_blocked THEN now() ELSE NULL END,
    blocked_reason = CASE WHEN p_blocked THEN v_clean_reason ELSE NULL END,
    updated_at = now()
  WHERE id = p_target_user_id;
END;
$$;

-- ============================================================================
-- 2. Admin-Only Test Deletion (Strictly When Attempt Count = 0)
-- ============================================================================

-- Aggregate attempt counts per test across ALL users (bypassing per-user RLS on test_attempts)
CREATE OR REPLACE FUNCTION public.get_level_test_attempt_counts()
RETURNS TABLE (
  test_id uuid,
  attempt_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to view test attempt counts.';
  END IF;

  RETURN QUERY
  SELECT ta.test_id, COUNT(*)::bigint AS attempt_count
  FROM public.test_attempts ta
  GROUP BY ta.test_id;
END;
$$;

-- Admin RPC: Delete a level test ONLY if caller is admin AND zero users have attempted it
CREATE OR REPLACE FUNCTION public.admin_delete_level_test(p_test_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempt_count bigint;
  v_rows_deleted integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can delete tests.';
  END IF;

  IF p_test_id IS NULL THEN
    RAISE EXCEPTION 'Test ID is required.';
  END IF;

  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts ta
  WHERE ta.test_id = p_test_id;

  IF v_attempt_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete this test because % user attempt(s) already exist.', v_attempt_count;
  END IF;

  DELETE FROM public.level_tests
  WHERE id = p_test_id;

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'Test not found or already deleted.';
  END IF;
END;
$$;

-- Harden RLS DELETE policy on public.level_tests so direct DELETE queries follow the same rule
DROP POLICY IF EXISTS "level_tests_delete_owner_or_admin" ON public.level_tests;
DROP POLICY IF EXISTS "level_tests_delete_creator_or_admin" ON public.level_tests;
DROP POLICY IF EXISTS "level_tests_delete_admin_unattempted" ON public.level_tests;
CREATE POLICY "level_tests_delete_admin_unattempted" ON public.level_tests
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    AND NOT EXISTS (
      SELECT 1
      FROM public.test_attempts ta
      WHERE ta.test_id = level_tests.id
    )
  );

-- ============================================================================
-- 3. Admin Chat Moderation (Delete Any Group or Direct Message for Security)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_group_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows_deleted integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can moderate and delete other users'' group messages.';
  END IF;

  DELETE FROM public.chat_group_messages
  WHERE id = p_message_id;

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'Group message not found or already deleted.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_direct_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows_deleted integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can moderate and delete direct chat messages.';
  END IF;

  DELETE FROM public.chat_messages
  WHERE id = p_message_id;

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'Message not found or already deleted.';
  END IF;
END;
$$;

-- ============================================================================
-- 4. Permissions & PostgREST Schema Cache Reload
-- ============================================================================
REVOKE ALL ON FUNCTION public.check_my_block_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_blocked(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_level_test_attempt_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_level_test(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_group_message(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_direct_message(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_my_block_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_level_test_attempt_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_level_test(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_group_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_direct_message(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
