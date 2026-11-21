-- GATE-2028 Supabase schema
-- Run once in Supabase SQL Editor on a fresh project.
-- This creates empty tables. Subjects, topics and subtopics are added in the frontend.

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
  role text NOT NULL DEFAULT 'student' CHECK (role = 'student'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- Turn on Row Level Security before granting access to the browser client.
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

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

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.subjects, public.topics, public.subtopics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks, public.tests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.subject_progress TO authenticated;

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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;

NOTIFY pgrst, 'reload schema';

-- These counts should be zero until you add syllabus data from the frontend.
SELECT
  (SELECT count(*) FROM public.subjects) AS subjects,
  (SELECT count(*) FROM public.topics) AS topics,
  (SELECT count(*) FROM public.subtopics) AS subtopics;
