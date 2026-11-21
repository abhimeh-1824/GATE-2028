-- GATE-2028 Supabase schema
-- Run in Supabase SQL Editor on a fresh project or to apply the latest schema.
-- This creates empty syllabus tables; subjects, topics and subtopics are added in the frontend.

BEGIN;

-- Each account owns its syllabus. No curriculum rows are seeded here.
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  code text NOT NULL CHECK (length(trim(code)) > 0),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (owner_id, code),
  UNIQUE (id, owner_id)
);

CREATE TABLE IF NOT EXISTS public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  sort_order integer NOT NULL DEFAULT 0,
  average_score numeric,
  score numeric,
  confidence_score numeric,
  pyq_accuracy numeric,
  accuracy numeric,
  subject_name text,
  status text,
  weightage_tier text,
  pyqs_solved integer,
  pyqs_total integer,
  UNIQUE (id, owner_id),
  FOREIGN KEY (subject_id, owner_id)
    REFERENCES public.subjects(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  sort_order integer NOT NULL DEFAULT 0,
  FOREIGN KEY (topic_id, owner_id)
    REFERENCES public.topics(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Aspirant',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'content_manager', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat IDs are kept separate from readable profile rows and exposed only by RPC.
CREATE TABLE IF NOT EXISTS public.chat_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.chat_profiles (user_id)
SELECT u.id FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.study_tasks (
  id text NOT NULL,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  priority text NOT NULL CHECK (priority IN ('urgent', 'high', 'normal')),
  estimated_minutes integer NOT NULL DEFAULT 45 CHECK (estimated_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, student_id)
);

CREATE TABLE IF NOT EXISTS public.subject_progress (
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, subject_id),
  FOREIGN KEY (subject_id, student_id)
    REFERENCES public.subjects(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.tests (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (member_a < member_b),
  UNIQUE (member_a, member_b)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx
  ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_sender_created_idx
  ON public.chat_messages(sender_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('abuse', 'violence', 'illegal', 'personal_info', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, message_id)
);

CREATE TABLE IF NOT EXISTS public.chat_groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.chat_groups (id, name)
VALUES ('gate-study', 'GATE Study Group')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.chat_group_members (
  group_id text NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

INSERT INTO public.chat_group_members (group_id, user_id)
SELECT 'gate-study', u.id FROM auth.users u
ON CONFLICT (group_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.chat_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

ALTER TABLE public.chat_group_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE INDEX IF NOT EXISTS chat_group_messages_group_created_idx
  ON public.chat_group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_group_messages_sender_created_idx
  ON public.chat_group_messages(sender_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_group_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_group_messages(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('abuse', 'violence', 'illegal', 'personal_info', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, message_id)
);

-- Turn on Row Level Security before granting access to the browser client.
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_reports ENABLE ROW LEVEL SECURITY;

-- Users can create and manage only their own subject tree.
DROP POLICY IF EXISTS subjects_owner_access ON public.subjects;
CREATE POLICY subjects_owner_access ON public.subjects
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS topics_owner_access ON public.topics;
CREATE POLICY topics_owner_access ON public.topics
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subtopics_owner_access ON public.subtopics;
CREATE POLICY subtopics_owner_access ON public.subtopics
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Peer comparison reads profile names/IDs; profile writes remain self-only.
DROP POLICY IF EXISTS profiles_read_authenticated ON public.profiles;
CREATE POLICY profiles_read_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS study_tasks_select_own ON public.study_tasks;
CREATE POLICY study_tasks_select_own ON public.study_tasks
  FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS study_tasks_insert_own ON public.study_tasks;
CREATE POLICY study_tasks_insert_own ON public.study_tasks
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS study_tasks_update_own ON public.study_tasks;
CREATE POLICY study_tasks_update_own ON public.study_tasks
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS study_tasks_delete_own ON public.study_tasks;
CREATE POLICY study_tasks_delete_own ON public.study_tasks
  FOR DELETE TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subject_progress_select_own ON public.subject_progress;
CREATE POLICY subject_progress_select_own ON public.subject_progress
  FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subject_progress_insert_own ON public.subject_progress;
CREATE POLICY subject_progress_insert_own ON public.subject_progress
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subject_progress_update_own ON public.subject_progress;
CREATE POLICY subject_progress_update_own ON public.subject_progress
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tests_select_own ON public.tests;
CREATE POLICY tests_select_own ON public.tests
  FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tests_insert_own ON public.tests;
CREATE POLICY tests_insert_own ON public.tests
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tests_update_own ON public.tests;
CREATE POLICY tests_update_own ON public.tests
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tests_delete_own ON public.tests;
CREATE POLICY tests_delete_own ON public.tests
  FOR DELETE TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS chat_conversations_read_member ON public.chat_conversations;
DROP POLICY IF EXISTS chat_messages_read_member ON public.chat_messages;
DROP POLICY IF EXISTS chat_blocks_read_own ON public.chat_blocks;
DROP POLICY IF EXISTS chat_blocks_insert_own ON public.chat_blocks;
DROP POLICY IF EXISTS chat_blocks_delete_own ON public.chat_blocks;
DROP POLICY IF EXISTS chat_reports_read_own ON public.chat_reports;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.subjects, public.topics, public.subtopics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks, public.tests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.subject_progress TO authenticated;
REVOKE ALL ON public.chat_profiles, public.chat_conversations, public.chat_messages,
  public.chat_blocks, public.chat_reports, public.chat_groups,
  public.chat_group_members, public.chat_group_messages, public.chat_group_reports
  FROM PUBLIC, anon, authenticated;

-- Keep a profile row in sync with Supabase Auth account creation.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'Aspirant'),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.chat_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.chat_group_members (group_id, user_id)
  VALUES ('gate-study', NEW.id)
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- Hierarchical Notes & Test Management (Subject → Topic → Subtopic)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'student');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_my_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_content_manager_or_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_my_role() IN ('content_manager', 'admin');
$$;

CREATE TABLE IF NOT EXISTS public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('subject', 'topic', 'subtopic')),
  entity_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.topics (id) ON DELETE CASCADE,
  subtopic_id uuid REFERENCES public.subtopics (id) ON DELETE CASCADE,
  note_type text NOT NULL CHECK (note_type IN ('complete', 'short')),
  title text NOT NULL,
  html_content text NOT NULL,
  sanitized_version integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, note_type),
  CONSTRAINT study_notes_hierarchy_consistency CHECK (
    (entity_type = 'subject'  AND entity_id = subject_id  AND topic_id IS NULL     AND subtopic_id IS NULL) OR
    (entity_type = 'topic'    AND entity_id = topic_id    AND topic_id IS NOT NULL AND subtopic_id IS NULL) OR
    (entity_type = 'subtopic' AND entity_id = subtopic_id AND topic_id IS NOT NULL AND subtopic_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.level_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('subject', 'topic', 'subtopic')),
  entity_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.topics (id) ON DELETE CASCADE,
  subtopic_id uuid REFERENCES public.subtopics (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 20 CHECK (duration_minutes >= 1 AND duration_minutes <= 240),
  passing_percentage numeric NOT NULL DEFAULT 40 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT level_tests_hierarchy_consistency CHECK (
    (entity_type = 'subject'  AND entity_id = subject_id  AND topic_id IS NULL     AND subtopic_id IS NULL) OR
    (entity_type = 'topic'    AND entity_id = topic_id    AND topic_id IS NOT NULL AND subtopic_id IS NULL) OR
    (entity_type = 'subtopic' AND entity_id = subtopic_id AND topic_id IS NOT NULL AND subtopic_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.level_tests (id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.level_tests (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes, public.level_tests, public.test_questions, public.test_attempts TO authenticated;

CREATE OR REPLACE FUNCTION public.chat_get_my_chat_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT cp.chat_id
  FROM public.chat_profiles cp
  WHERE cp.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.chat_group_join()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to join the study group.';
  END IF;

  INSERT INTO public.chat_group_members (group_id, user_id)
  VALUES ('gate-study', v_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_list_conversations()
RETURNS TABLE (
  conversation_id uuid,
  peer_chat_id uuid,
  updated_at timestamptz,
  blocked_by_me boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.id,
    cp.chat_id,
    c.updated_at,
    EXISTS (
      SELECT 1 FROM public.chat_blocks b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = cp.user_id
    )
  FROM public.chat_conversations c
  JOIN public.chat_profiles cp
    ON cp.user_id = CASE WHEN c.member_a = auth.uid() THEN c.member_b ELSE c.member_a END
  WHERE c.member_a = auth.uid() OR c.member_b = auth.uid()
  ORDER BY c.updated_at DESC
$$;

DROP FUNCTION IF EXISTS public.chat_load_messages(uuid);
CREATE FUNCTION public.chat_load_messages(p_conversation_id uuid)
RETURNS TABLE (
  message_id uuid,
  sender_is_me boolean,
  body text,
  created_at timestamptz,
  edited_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = p_conversation_id
      AND (c.member_a = auth.uid() OR c.member_b = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Conversation not found.';
  END IF;

  RETURN QUERY
  SELECT page.id, page.sender_is_me, page.body, page.created_at, page.edited_at
  FROM (
    SELECT m.id, (m.sender_id = auth.uid()) AS sender_is_me, m.body, m.created_at, m.edited_at
    FROM public.chat_messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT 100
  ) page
  ORDER BY page.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_set_user_blocked(p_peer_chat_id uuid, p_blocked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_peer_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to manage blocked users.';
  END IF;

  SELECT cp.user_id INTO v_peer_id
  FROM public.chat_profiles cp
  WHERE cp.chat_id = p_peer_chat_id;

  IF v_peer_id IS NULL OR v_peer_id = v_user_id THEN
    RAISE EXCEPTION 'Chat ID not found.';
  END IF;

  PERFORM cp.user_id
  FROM public.chat_profiles cp
  WHERE cp.user_id IN (v_user_id, v_peer_id)
  ORDER BY cp.user_id
  FOR UPDATE;

  IF p_blocked THEN
    INSERT INTO public.chat_blocks (blocker_id, blocked_id)
    VALUES (v_user_id, v_peer_id)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  ELSE
    DELETE FROM public.chat_blocks
    WHERE blocker_id = v_user_id AND blocked_id = v_peer_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_start_direct_conversation(p_chat_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_peer_id uuid;
  v_member_a uuid;
  v_member_b uuid;
  v_conversation_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to use chat.';
  END IF;

  SELECT cp.user_id INTO v_peer_id
  FROM public.chat_profiles cp
  WHERE cp.chat_id = p_chat_id;

  IF v_peer_id IS NULL THEN
    RAISE EXCEPTION 'Chat ID not found.';
  END IF;
  IF v_peer_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot start a chat with your own ID.';
  END IF;
  PERFORM cp.user_id
  FROM public.chat_profiles cp
  WHERE cp.user_id IN (v_user_id, v_peer_id)
  ORDER BY cp.user_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.chat_blocks b
    WHERE (b.blocker_id = v_user_id AND b.blocked_id = v_peer_id)
       OR (b.blocker_id = v_peer_id AND b.blocked_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'This chat is unavailable.';
  END IF;

  v_member_a := LEAST(v_user_id, v_peer_id);
  v_member_b := GREATEST(v_user_id, v_peer_id);

  INSERT INTO public.chat_conversations (member_a, member_b)
  VALUES (v_member_a, v_member_b)
  ON CONFLICT (member_a, member_b) DO NOTHING;

  SELECT c.id INTO v_conversation_id
  FROM public.chat_conversations c
  WHERE c.member_a = v_member_a AND c.member_b = v_member_b;

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_validate_message(p_body text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
BEGIN
  IF p_body IS NULL OR char_length(trim(p_body)) = 0 OR char_length(p_body) > 2000 THEN
    RAISE EXCEPTION 'Messages must be between 1 and 2000 characters.';
  END IF;

  v_normalized := lower(regexp_replace(p_body, '[^[:alnum:]]+', ' ', 'g'));
  IF v_normalized ~ '(^| )(fuck|fucking|shit|bitch|asshole|bastard|chutiya|madarchod|bhenchod|behenchod|gandu|saale|harami|randi)( |$)'
     OR v_normalized ~ '(^| )teri (ma|maa) ki( |$)'
     OR p_body ~ '(तेरी[[:space:]]*माँ[[:space:]]*की|तेरी[[:space:]]*मां[[:space:]]*की|चूतिया|चूतिये|मादरचोद|बहनचोद|भेनचोद|गांडू|हरामी|रंडी)' THEN
    RAISE EXCEPTION 'Message blocked by the abuse or hate filter.';
  END IF;
  IF v_normalized ~ '(^| )(murder|kill|rape|suicide|bomb|explosive|weapon|poison|shoot|terror|cocaine|meth|steal|hack|phish|fraud|scam|blackmail|doxx|cheat|plagiarize)( |$)'
     OR v_normalized ~ '(^| )(mar|maar) (dal|daal)?(uga|unga|ungi|ugi|dunga|dungi|duga|dugi|oonga|oongi)( |$)'
     OR v_normalized ~ '(^| )(jaan se mar|jaan se maar)( |$)'
     OR p_body ~ '(मार[[:space:]]*(डाल[[:space:]]*)?(दूंगा|दूँगा|दुंगा|दूंगी|दूँगी|दुंगी|डूंगा|डूँगा|डूंगी|डूँगी|ूंगा|ूँगा|ूंगी|ूँगी)|जान[[:space:]]*से[[:space:]]*मार)' THEN
    RAISE EXCEPTION 'Message blocked by the violence, illegal activity, or cheating filter.';
  END IF;
  IF p_body ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
     OR p_body ~ '(^|[^0-9])[+]?[0-9][0-9 ()-]{8,}[0-9]([^0-9]|$)' THEN
    RAISE EXCEPTION 'Do not share email addresses or phone numbers in chat.';
  END IF;

  RETURN trim(p_body);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_send_message(p_conversation_id uuid, p_body text)
RETURNS TABLE (id uuid, sender_id uuid, body text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_peer_id uuid;
  v_body text;
  v_message_id uuid;
  v_recent_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to send messages.';
  END IF;
  v_body := public.chat_validate_message(p_body);

  SELECT CASE
    WHEN c.member_a = v_user_id THEN c.member_b
    ELSE c.member_a
  END INTO v_peer_id
  FROM public.chat_conversations c
  WHERE c.id = p_conversation_id
    AND (c.member_a = v_user_id OR c.member_b = v_user_id);

  IF v_peer_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found.';
  END IF;
  PERFORM cp.user_id
  FROM public.chat_profiles cp
  WHERE cp.user_id IN (v_user_id, v_peer_id)
  ORDER BY cp.user_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.chat_blocks b
    WHERE (b.blocker_id = v_user_id AND b.blocked_id = v_peer_id)
       OR (b.blocker_id = v_peer_id AND b.blocked_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Messages are disabled for this conversation.';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.chat_messages m
  WHERE m.sender_id = v_user_id
    AND m.created_at > now() - interval '1 minute';
  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'Message rate limit reached. Try again in a minute.';
  END IF;

  INSERT INTO public.chat_messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_user_id, v_body)
  RETURNING chat_messages.id INTO v_message_id;

  UPDATE public.chat_conversations
  SET updated_at = now()
  WHERE chat_conversations.id = p_conversation_id;

  RETURN QUERY
  SELECT m.id, m.sender_id, m.body, m.created_at
  FROM public.chat_messages m
  WHERE m.id = v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_edit_message(p_message_id uuid, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_body text;
  v_rows_updated integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to edit messages.';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.chat_messages m
    JOIN public.chat_conversations c ON c.id = m.conversation_id
    WHERE m.id = p_message_id
      AND m.sender_id = v_user_id
      AND m.created_at >= now() - interval '1 hour'
      AND (c.member_a = v_user_id OR c.member_b = v_user_id)
  ) THEN
    RAISE EXCEPTION 'You can edit only your own messages for one hour after sending.';
  END IF;

  v_body := public.chat_validate_message(p_body);
  UPDATE public.chat_messages
  SET body = v_body, edited_at = now()
  WHERE id = p_message_id
    AND sender_id = v_user_id
    AND created_at >= now() - interval '1 hour';
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'The edit window has expired or the message was deleted.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_delete_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rows_deleted integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to delete messages.';
  END IF;

  DELETE FROM public.chat_messages m
  USING public.chat_conversations c
  WHERE m.id = p_message_id
    AND m.conversation_id = c.id
    AND m.sender_id = v_user_id
    AND m.created_at >= now() - interval '1 hour'
    AND (c.member_a = v_user_id OR c.member_b = v_user_id);
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'You can delete only your own messages for one hour after sending.';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.chat_group_load_messages();
CREATE OR REPLACE FUNCTION public.chat_group_load_messages()
RETURNS TABLE (
  message_id uuid,
  sender_chat_id uuid,
  sender_is_me boolean,
  body text,
  created_at timestamptz,
  edited_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_group_members gm
    WHERE gm.group_id = 'gate-study' AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Join the study group before loading its messages.';
  END IF;

  RETURN QUERY
  SELECT page.id, cp.chat_id, page.sender_id = auth.uid(), page.body, page.created_at, page.edited_at
  FROM (
    SELECT m.id, m.sender_id, m.body, m.created_at, m.edited_at
    FROM public.chat_group_messages m
    WHERE m.group_id = 'gate-study'
    ORDER BY m.created_at DESC
    LIMIT 100
  ) page
  JOIN public.chat_profiles cp ON cp.user_id = page.sender_id
  ORDER BY page.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_group_send_message(p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_body text;
  v_recent_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to send messages.';
  END IF;

  v_body := public.chat_validate_message(p_body);
  INSERT INTO public.chat_group_members (group_id, user_id)
  VALUES ('gate-study', v_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  PERFORM cp.user_id
  FROM public.chat_profiles cp
  WHERE cp.user_id = v_user_id
  FOR UPDATE;

  SELECT
    (SELECT count(*) FROM public.chat_messages m
      WHERE m.sender_id = v_user_id AND m.created_at > now() - interval '1 minute')
    +
    (SELECT count(*) FROM public.chat_group_messages gm
      WHERE gm.sender_id = v_user_id AND gm.created_at > now() - interval '1 minute')
  INTO v_recent_count;
  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'Message rate limit reached. Try again in a minute.';
  END IF;

  INSERT INTO public.chat_group_messages (group_id, sender_id, body)
  VALUES ('gate-study', v_user_id, v_body);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_group_edit_message(p_message_id uuid, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_body text;
  v_rows_updated integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to edit group messages.';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.chat_group_messages gm
    JOIN public.chat_group_members member
      ON member.group_id = gm.group_id AND member.user_id = v_user_id
    WHERE gm.id = p_message_id
      AND gm.group_id = 'gate-study'
      AND gm.sender_id = v_user_id
      AND gm.created_at >= now() - interval '1 hour'
  ) THEN
    RAISE EXCEPTION 'You can edit only your own group messages for one hour after sending.';
  END IF;

  v_body := public.chat_validate_message(p_body);
  UPDATE public.chat_group_messages
  SET body = v_body, edited_at = now()
  WHERE id = p_message_id
    AND group_id = 'gate-study'
    AND sender_id = v_user_id
    AND created_at >= now() - interval '1 hour';
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'The edit window has expired or the message was deleted.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_group_delete_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rows_deleted integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to delete group messages.';
  END IF;

  DELETE FROM public.chat_group_messages gm
  USING public.chat_group_members member
  WHERE gm.id = p_message_id
    AND gm.group_id = 'gate-study'
    AND gm.group_id = member.group_id
    AND member.user_id = v_user_id
    AND gm.sender_id = v_user_id
    AND gm.created_at >= now() - interval '1 hour';
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'You can delete only your own group messages for one hour after sending.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_group_report_message(p_message_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reported_user_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to report a message.';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('abuse', 'violence', 'illegal', 'personal_info', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_group_members gm
    WHERE gm.group_id = 'gate-study' AND gm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Join the study group before reporting messages.';
  END IF;

  SELECT gm.sender_id INTO v_reported_user_id
  FROM public.chat_group_messages gm
  WHERE gm.id = p_message_id
    AND gm.group_id = 'gate-study'
    AND gm.sender_id <> v_user_id;

  IF v_reported_user_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or cannot be reported.';
  END IF;

  INSERT INTO public.chat_group_reports (reporter_id, reported_user_id, message_id, reason)
  VALUES (v_user_id, v_reported_user_id, p_message_id, p_reason)
  ON CONFLICT (reporter_id, message_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_report_message(p_message_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reported_user_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to report a message.';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('abuse', 'violence', 'illegal', 'personal_info', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason.';
  END IF;

  SELECT m.sender_id INTO v_reported_user_id
  FROM public.chat_messages m
  JOIN public.chat_conversations c ON c.id = m.conversation_id
  WHERE m.id = p_message_id
    AND m.sender_id <> v_user_id
    AND (c.member_a = v_user_id OR c.member_b = v_user_id);

  IF v_reported_user_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or cannot be reported.';
  END IF;

  INSERT INTO public.chat_reports (reporter_id, reported_user_id, message_id, reason)
  VALUES (v_user_id, v_reported_user_id, p_message_id, p_reason)
  ON CONFLICT (reporter_id, message_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_start_direct_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_send_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_edit_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_delete_message(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_validate_message(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_report_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_get_my_chat_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_join() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_load_messages() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_send_message(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_edit_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_delete_message(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_group_report_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_list_conversations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_load_messages(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_set_user_blocked(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_start_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_send_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_edit_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_delete_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_report_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_get_my_chat_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_join() TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_load_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_send_message(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_edit_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_delete_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_group_report_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_list_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_load_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_set_user_blocked(uuid, boolean) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- These counts should be zero until you add syllabus data from the frontend.
SELECT
  (SELECT count(*) FROM public.subjects) AS subjects,
  (SELECT count(*) FROM public.topics) AS topics,
  (SELECT count(*) FROM public.subtopics) AS subtopics;
