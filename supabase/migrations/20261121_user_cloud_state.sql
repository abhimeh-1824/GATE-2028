-- Database-only study state migration.
-- Preserves existing rows and adds one JSONB state record per authenticated user.

create table if not exists public.user_study_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_json jsonb not null default '{}'::jsonb,
  state_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_study_state enable row level security;

drop policy if exists "user_study_state_select_own" on public.user_study_state;
create policy "user_study_state_select_own" on public.user_study_state
  for select using (user_id = auth.uid());

drop policy if exists "user_study_state_insert_own" on public.user_study_state;
create policy "user_study_state_insert_own" on public.user_study_state
  for insert with check (user_id = auth.uid());

drop policy if exists "user_study_state_update_own" on public.user_study_state;
create policy "user_study_state_update_own" on public.user_study_state
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_study_state_delete_own" on public.user_study_state;
create policy "user_study_state_delete_own" on public.user_study_state
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.user_study_state to authenticated;

create table if not exists public.user_custom_resources (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id text not null,
  resource_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_custom_resources enable row level security;
drop policy if exists "user_custom_resources_owner" on public.user_custom_resources;
create policy "user_custom_resources_owner" on public.user_custom_resources
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_custom_resources to authenticated;

create table if not exists public.daily_study_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, note_date)
);

alter table public.daily_study_notes enable row level security;
drop policy if exists "daily_study_notes_owner" on public.daily_study_notes;
create policy "daily_study_notes_owner" on public.daily_study_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.daily_study_notes to authenticated;

create table if not exists public.resource_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

alter table public.resource_notes enable row level security;
drop policy if exists "resource_notes_owner" on public.resource_notes;
create policy "resource_notes_owner" on public.resource_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.resource_notes to authenticated;

create or replace function public.touch_user_study_state_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_study_state_updated_at on public.user_study_state;
create trigger trg_user_study_state_updated_at
  before update on public.user_study_state
  for each row execute function public.touch_user_study_state_updated_at();
