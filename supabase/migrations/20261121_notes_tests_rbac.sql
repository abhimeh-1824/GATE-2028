-- ============================================================================
-- Hierarchical Notes & Test Management + 3-Role RBAC (Non-Destructive Migration)
-- Preserves all existing subjects, topics, subtopics, profiles, tasks, and tests.
-- ============================================================================

-- 1. Expand profiles.role to support 3 roles: student | content_manager | admin
do $$
declare
  c_name text;
begin
  for c_name in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', c_name);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'content_manager', 'admin'));

-- Role helper functions (SECURITY DEFINER to avoid recursive RLS queries on profiles)
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'student'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() = 'admin';
$$;

create or replace function public.is_content_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('content_manager', 'admin');
$$;

-- Allow admins to update user roles safely
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Allow content managers & admins to view and manage shared syllabus rows as well as their own
drop policy if exists "subjects_select_all_auth" on public.subjects;
create policy "subjects_select_all_auth" on public.subjects
  for select using (auth.role() = 'authenticated');

drop policy if exists "subjects_manage_content_roles" on public.subjects;
create policy "subjects_manage_content_roles" on public.subjects
  for all
  using (public.is_content_manager_or_admin())
  with check (public.is_content_manager_or_admin());

drop policy if exists "topics_select_all_auth" on public.topics;
create policy "topics_select_all_auth" on public.topics
  for select using (auth.role() = 'authenticated');

drop policy if exists "topics_manage_content_roles" on public.topics;
create policy "topics_manage_content_roles" on public.topics
  for all
  using (public.is_content_manager_or_admin())
  with check (public.is_content_manager_or_admin());

drop policy if exists "subtopics_select_all_auth" on public.subtopics;
create policy "subtopics_select_all_auth" on public.subtopics
  for select using (auth.role() = 'authenticated');

drop policy if exists "subtopics_manage_content_roles" on public.subtopics;
create policy "subtopics_manage_content_roles" on public.subtopics
  for all
  using (public.is_content_manager_or_admin())
  with check (public.is_content_manager_or_admin());

-- ============================================================================
-- 2. Hierarchical HTML Study Notes (Subject / Topic / Subtopic × Complete / Short)
-- ============================================================================
create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  entity_type text not null check (entity_type in ('subject', 'topic', 'subtopic')),
  entity_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete cascade,
  subtopic_id uuid references public.subtopics (id) on delete cascade,
  note_type text not null check (note_type in ('complete', 'short')),
  title text not null,
  html_content text not null,
  sanitized_version integer not null default 1,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, note_type),
  constraint study_notes_hierarchy_consistency check (
    (entity_type = 'subject'  and entity_id = subject_id  and topic_id is null     and subtopic_id is null) or
    (entity_type = 'topic'    and entity_id = topic_id    and topic_id is not null and subtopic_id is null) or
    (entity_type = 'subtopic' and entity_id = subtopic_id and topic_id is not null and subtopic_id is not null)
  )
);

create index if not exists idx_study_notes_entity on public.study_notes (entity_type, entity_id);
create index if not exists idx_study_notes_subject on public.study_notes (subject_id);
create index if not exists idx_study_notes_topic on public.study_notes (topic_id) where topic_id is not null;
create index if not exists idx_study_notes_subtopic on public.study_notes (subtopic_id) where subtopic_id is not null;

-- ============================================================================
-- 3. Hierarchical Optional Tests (Subject / Topic / Subtopic)
-- ============================================================================
create table if not exists public.level_tests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('subject', 'topic', 'subtopic')),
  entity_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete cascade,
  subtopic_id uuid references public.subtopics (id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_minutes integer not null default 20 check (duration_minutes >= 1 and duration_minutes <= 240),
  passing_percentage numeric not null default 40 check (passing_percentage >= 0 and passing_percentage <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint level_tests_hierarchy_consistency check (
    (entity_type = 'subject'  and entity_id = subject_id  and topic_id is null     and subtopic_id is null) or
    (entity_type = 'topic'    and entity_id = topic_id    and topic_id is not null and subtopic_id is null) or
    (entity_type = 'subtopic' and entity_id = subtopic_id and topic_id is not null and subtopic_id is not null)
  )
);

create index if not exists idx_level_tests_entity on public.level_tests (entity_type, entity_id);
create index if not exists idx_level_tests_subject on public.level_tests (subject_id);
create index if not exists idx_level_tests_active on public.level_tests (is_active);
create index if not exists idx_level_tests_creator on public.level_tests (created_by);

-- ============================================================================
-- 4. Test Questions (MCQ A-D + Optional Explanation, Difficulty, Image)
-- ============================================================================
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.level_tests (id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  question_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_test_questions_test_order on public.test_questions (test_id, sort_order);

-- ============================================================================
-- 5. Student Test Attempts & Review History
-- ============================================================================
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.level_tests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers_json jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  total_questions integer not null default 0,
  percentage numeric not null default 0,
  time_taken_seconds integer not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists idx_test_attempts_user_test on public.test_attempts (user_id, test_id, completed_at desc);

-- ============================================================================
-- 6. Row-Level Security Policies
-- ============================================================================
alter table public.study_notes enable row level security;
alter table public.level_tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;

-- study_notes: All authenticated users can read; users can manage notes they own; content_manager & admin can manage all.
drop policy if exists "study_notes_select_auth" on public.study_notes;
create policy "study_notes_select_auth" on public.study_notes
  for select using (auth.role() = 'authenticated');

drop policy if exists "study_notes_insert_content_roles" on public.study_notes;
drop policy if exists "study_notes_insert_owner" on public.study_notes;
create policy "study_notes_insert_owner" on public.study_notes
  for insert
  with check (
    owner_id = auth.uid()
    and updated_by = auth.uid()
  );

drop policy if exists "study_notes_update_content_roles" on public.study_notes;
drop policy if exists "study_notes_update_owner_or_manager" on public.study_notes;
create policy "study_notes_update_owner_or_manager" on public.study_notes
  for update
  using (
    owner_id = auth.uid()
    or public.is_content_manager_or_admin()
  )
  with check (
    (
      owner_id = auth.uid()
      and updated_by = auth.uid()
    )
    or public.is_content_manager_or_admin()
  );

drop policy if exists "study_notes_delete_content_roles" on public.study_notes;
drop policy if exists "study_notes_delete_owner_or_manager" on public.study_notes;
create policy "study_notes_delete_owner_or_manager" on public.study_notes
  for delete using (
    owner_id = auth.uid()
    or public.is_content_manager_or_admin()
  );

-- level_tests: All authenticated users can view active tests (or their own inactive tests, or admin all)
-- Any authenticated user can create tests; owner or admin can update/delete
drop policy if exists "level_tests_select_auth" on public.level_tests;
create policy "level_tests_select_auth" on public.level_tests
  for select using (
    auth.role() = 'authenticated'
    and (is_active = true or created_by = auth.uid() or public.is_admin())
  );

drop policy if exists "level_tests_insert_any_auth" on public.level_tests;
create policy "level_tests_insert_any_auth" on public.level_tests
  for insert with check (auth.uid() = created_by);

drop policy if exists "level_tests_update_owner_or_admin" on public.level_tests;
create policy "level_tests_update_owner_or_admin" on public.level_tests
  for update using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "level_tests_delete_owner_or_admin" on public.level_tests;
create policy "level_tests_delete_owner_or_admin" on public.level_tests
  for delete using (created_by = auth.uid() or public.is_admin());

-- test_questions: Readable if parent test is visible; writable by parent test creator or admin
drop policy if exists "test_questions_select_visible_test" on public.test_questions;
create policy "test_questions_select_visible_test" on public.test_questions
  for select using (
    exists (
      select 1 from public.level_tests t
      where t.id = test_questions.test_id
        and (t.is_active = true or t.created_by = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "test_questions_manage_owner_or_admin" on public.test_questions;
create policy "test_questions_manage_owner_or_admin" on public.test_questions
  for all using (
    exists (
      select 1 from public.level_tests t
      where t.id = test_questions.test_id
        and (t.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.level_tests t
      where t.id = test_questions.test_id
        and (t.created_by = auth.uid() or public.is_admin())
    )
  );

-- test_attempts: Users see and create their own attempts; admins can view all
drop policy if exists "test_attempts_select_own_or_admin" on public.test_attempts;
create policy "test_attempts_select_own_or_admin" on public.test_attempts
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "test_attempts_insert_own" on public.test_attempts;
create policy "test_attempts_insert_own" on public.test_attempts
  for insert with check (user_id = auth.uid());

-- updated_at trigger for study_notes, level_tests, test_questions
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_study_notes_updated_at on public.study_notes;
create trigger trg_study_notes_updated_at
  before update on public.study_notes
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_level_tests_updated_at on public.level_tests;
create trigger trg_level_tests_updated_at
  before update on public.level_tests
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_test_questions_updated_at on public.test_questions;
create trigger trg_test_questions_updated_at
  before update on public.test_questions
  for each row execute function public.touch_updated_at();
