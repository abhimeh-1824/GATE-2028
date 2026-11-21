import { supabase } from './supabase';

export interface StoredUserStudyState {
  subjects?: unknown;
  tasks?: unknown;
  sprints?: unknown;
  mockTests?: unknown;
  milestones?: unknown;
  calendarEvents?: unknown;
  settings?: unknown;
  baseLoggedHours?: number;
  [key: string]: unknown;
}

export async function loadUserStudyState(userId: string): Promise<{
  state: StoredUserStudyState | null;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('user_study_state')
    .select('state_json')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { state: null, error: error.message };
  return { state: (data?.state_json as StoredUserStudyState | undefined) || null };
}

export async function saveUserStudyState(
  userId: string,
  state: StoredUserStudyState
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_study_state')
    .upsert({
      user_id: userId,
      state_json: state,
      state_version: 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function migrateLegacyLocalStateToCloud(
  userId: string
): Promise<{ migrated: boolean; error?: string }> {
  const prefix = `gateda_2028_user_${userId}_`;
  const keys = [
    'subjects', 'tasks', 'sprints', 'mockTests', 'milestones',
    'calendarEvents', 'settings', 'baseHours',
  ];

  const state: StoredUserStudyState = {};
  let found = false;

  for (const key of keys) {
    const raw = localStorage.getItem(`${prefix}${key}`);
    if (!raw) continue;

    found = true;
    try {
      if (key === 'baseHours') {
        state.baseLoggedHours = Number(raw);
      } else {
        state[key] = JSON.parse(raw);
      }
    } catch {
      // Skip malformed legacy values.
    }
  }

  if (!found) return { migrated: false };

  const existing = await loadUserStudyState(userId);
  if (existing.error) return { migrated: false, error: existing.error };

  const combined = existing.state ? { ...existing.state, ...state } : state;
  const saved = await saveUserStudyState(userId, combined);
  if (!saved.success) return { migrated: false, error: saved.error };

  for (const key of keys) {
    localStorage.removeItem(`${prefix}${key}`);
  }

  return { migrated: true };
}

export async function saveDailyNote(
  userId: string,
  date: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('daily_study_notes')
    .upsert({ user_id: userId, note_date: date, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id,note_date' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function loadDailyNote(userId: string, date: string): Promise<string> {
  const { data } = await supabase
    .from('daily_study_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('note_date', date)
    .maybeSingle();
  return data?.content || '';
}

export async function saveResourceNote(
  userId: string,
  resourceId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('resource_notes')
    .upsert({ user_id: userId, resource_id: resourceId, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id,resource_id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function loadResourceNote(userId: string, resourceId: string): Promise<string> {
  const { data } = await supabase
    .from('resource_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .maybeSingle();
  return data?.content || '';
}
