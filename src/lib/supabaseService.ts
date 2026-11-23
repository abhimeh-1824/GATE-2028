import { supabase } from './supabase';
import { getAppUrl } from './appUrl';
import {
  AuthUser,
  Task,
  SubjectId,
  PriorityLevel,
  TaskType,
  Subject,
  Topic,
  TopicStatus,
  UserRole,
  SubtopicItem,
  ManagedUserProfile,
} from '../types';

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
  needsEmailConfirmation?: boolean;
}

export interface TopicNeedingRevision {
  id: string;
  title: string;
  subjectId: SubjectId;
  subjectName: string;
  averageScore: number; // 0 - 10 scale
  pyqAccuracy: number;  // 0 - 100%
  reason: 'low_score' | 'low_accuracy' | 'both';
  status: string;
  weightageTier: string;
  pyqsSolved: number;
  pyqsTotal: number;
  subtopics?: string[];
}

// Key for storing registered users list locally for quick switching
let inMemoryAccounts: AuthUser[] = [];
let inMemoryActiveUserId: string | null = null;

export const getSavedAccounts = (): AuthUser[] => inMemoryAccounts;

export const saveAccountLocally = (user: AuthUser) => {
  inMemoryAccounts = [
    ...inMemoryAccounts.filter((account) => account.id !== user.id && account.email !== user.email),
    user,
  ];
};

export const getActiveUserId = (): string | null => inMemoryActiveUserId;

export const setActiveUserId = (userId: string | null) => {
  inMemoryActiveUserId = userId;
};

/**
 * Register a new user in Supabase Auth & DB
 */
export async function signUpUser(
  email: string,
  password: string,
  fullName: string,
  targetAir: number = 1,
  targetCollege: string = 'IISc Bangalore (M.Tech AI)'
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAppUrl('/'),
        data: {
          full_name: fullName,
          target_air: targetAir,
          target_college: targetCollege,
        },
      },
    });

    if (error) {
      // If user already exists, suggest sign in
      return { user: null, error: error.message };
    }

    const sbUser = data.user;
    if (!sbUser) {
      return { user: null, error: 'Registration failed to create user.' };
    }

    const newUser: AuthUser = {
      id: sbUser.id,
      email: sbUser.email || email,
      fullName: fullName || sbUser.user_metadata?.full_name || 'Aspirant',
      targetAir: targetAir || 1,
      targetCollege: targetCollege || 'IISc Bangalore (M.Tech AI)',
      createdAt: sbUser.created_at || new Date().toISOString(),
      isConfirmed: !!data.session,
    };

    // Try saving profile to Supabase database profiles table
    try {
      await supabase.from('profiles').upsert({
        id: sbUser.id,
        full_name: fullName,
        role: 'student',
        updated_at: new Date().toISOString(),
      });
    } catch (profileErr) {
      console.warn('Profile DB upsert note (may require email confirmation):', profileErr);
    }

    // Save locally to user list
    saveAccountLocally(newUser);

    if (data.session) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        return {
          user: null,
          error: 'Account created, but the new session could not be cleared. Please sign out before logging in.',
        };
      }
    }

    return {
      user: newUser,
      error: null,
      needsEmailConfirmation: !data.session,
    };
  } catch (err: any) {
    return { user: null, error: err.message || 'An unexpected error occurred during registration.' };
  }
}

/**
 * Sign in an existing user with Supabase Auth
 */
export async function signInUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return {
          user: null,
          error: 'Your email address is not yet confirmed. Please verify your email via the confirmation link or contact support.',
          needsEmailConfirmation: true,
        };
      }
      return { user: null, error: error.message };
    }

    const sbUser = data.user;
    if (!sbUser) {
      return { user: null, error: 'Sign in succeeded but user was not found.' };
    }

    // Fetch user profile from Supabase profiles table
    let fullName = sbUser.user_metadata?.full_name || 'Aspirant';
    let targetAir = Number(sbUser.user_metadata?.target_air) || 1;
    let targetCollege = sbUser.user_metadata?.target_college || 'IISc Bangalore (M.Tech AI)';
    let role: UserRole = 'student';

    let isBlocked = false;
    let blockedReason: string | null = null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      if (profile?.full_name) {
        fullName = profile.full_name;
      }
      if (profile?.role === 'admin' || profile?.role === 'content_manager' || profile?.role === 'student') {
        role = profile.role;
      }
      if (profile?.is_blocked === true) {
        isBlocked = true;
        blockedReason = typeof profile.blocked_reason === 'string' ? profile.blocked_reason : null;
      }
    } catch (e) {
      console.warn('Could not fetch remote profile:', e);
    }

    if (isBlocked) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore signOut failure
      }
      setActiveUserId(null);
      return {
        user: null,
        error: blockedReason
          ? `Your account has been blocked by an administrator: ${blockedReason}`
          : 'Your account has been blocked by an administrator and cannot sign in.',
      };
    }

    const authUser: AuthUser = {
      id: sbUser.id,
      email: sbUser.email || email,
      fullName,
      role,
      targetAir,
      targetCollege,
      createdAt: sbUser.created_at || new Date().toISOString(),
      isConfirmed: true,
    };

    saveAccountLocally(authUser);
    setActiveUserId(authUser.id);

    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Error signing in.' };
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut error:', e);
  }
  setActiveUserId(null);
}

/**
 * Sync a task to Supabase study_tasks table
 */
export async function syncTaskToSupabase(task: Task, studentId?: string) {
  // Prevent sync for demo or guest accounts
  if (studentId && (studentId.startsWith('demo_') || studentId.startsWith('guest_') || studentId.includes('aspirant'))) {
    return;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;

    const verifiedUserId = session.user.id;
    if (studentId && studentId !== verifiedUserId) {
      console.warn('syncTaskToSupabase: caller studentId does not match verified session');
      return;
    }

    const { error } = await supabase.from('study_tasks').upsert({
      id: task.id,
      student_id: verifiedUserId,
      title: task.title,
      subject_id: task.subjectId,
      status: task.completed ? 'completed' : 'pending',
      priority: task.priority,
      estimated_minutes: task.durationMinutes,
      created_at: task.date || new Date().toISOString(),
    });
    if (error) {
      console.warn('Supabase study_tasks sync notice:', error.message);
    }
  } catch (e) {
    console.warn('Could not sync task to Supabase:', e);
  }
}

/**
 * Delete a task from Supabase study_tasks table
 */
export async function deleteTaskFromSupabase(taskId: string, studentId?: string) {
  if (studentId && (studentId.startsWith('demo_') || studentId.startsWith('guest_') || studentId.includes('aspirant'))) {
    return;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;

    const verifiedUserId = session.user.id;
    if (studentId && studentId !== verifiedUserId) {
      console.warn('deleteTaskFromSupabase: caller studentId does not match verified session');
      return;
    }

    const { error } = await supabase
      .from('study_tasks')
      .delete()
      .eq('id', taskId)
      .eq('student_id', verifiedUserId);
    if (error) {
      console.warn('Supabase deleteTask notice:', error.message);
    }
  } catch (e) {
    console.warn('Could not delete task from Supabase:', e);
  }
}

/**
 * Load tasks for a user from Supabase study_tasks table, derived strictly from active session
 */
export async function loadTasksFromSupabase(studentId?: string): Promise<Task[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return [];

    const verifiedUserId = session.user.id;
    if (studentId && studentId !== verifiedUserId) {
      console.warn('loadTasksFromSupabase: caller studentId does not match verified session');
      return [];
    }

    const { data, error } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('student_id', verifiedUserId);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      subjectId: (row.subject_id as SubjectId) || '',
      topicTitle: row.title,
      type: 'concept' as TaskType,
      durationMinutes: row.estimated_minutes || 45,
      completed: row.status === 'completed',
      date: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      priority: (row.priority as PriorityLevel) || 'high',
    }));
  } catch (e) {
    console.warn('Could not load tasks from Supabase:', e);
    return [];
  }
}

/**
 * Service layer function that queries Supabase for topics with an average score < 6
 * or PYQ accuracy < 60%, and returns them formatted for targeted study drills.
 */
export async function fetchTopicsNeedingRevision(
  studentId?: string,
  localSubjects?: Subject[]
): Promise<TopicNeedingRevision[]> {
  const topicsList: TopicNeedingRevision[] = [];

  try {
    // 1. Query Supabase topics table with optional user scoping
    let query = supabase.from('topics').select('*');
    if (studentId) {
      query = query.eq('owner_id', studentId);
    }
    const { data: supabaseTopics, error } = await query;

    if (!error && supabaseTopics && supabaseTopics.length > 0) {
      for (const row of supabaseTopics) {
        const avgScore = Number(
          row.average_score ?? row.score ?? (row.confidence_score ? row.confidence_score * 2 : 0)
        );
        const pyqAcc = Number(row.pyq_accuracy ?? row.accuracy ?? 0);

        if (avgScore < 6 || pyqAcc < 60) {
          const reason: 'low_score' | 'low_accuracy' | 'both' =
            avgScore < 6 && pyqAcc < 60 ? 'both' : avgScore < 6 ? 'low_score' : 'low_accuracy';

          topicsList.push({
            id: String(row.id),
            title: row.name || row.title || 'Topic',
            subjectId: (row.subject_id as SubjectId) || '',
            subjectName: row.subject_name || '',
            averageScore: avgScore,
            pyqAccuracy: pyqAcc,
            reason,
            status: row.status || 'in_progress',
            weightageTier: row.weightage_tier || 'Core (Medium)',
            pyqsSolved: Number(row.pyqs_solved || 0),
            pyqsTotal: Number(row.pyqs_total || 25),
          });
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetchTopicsNeedingRevision notice:', err);
  }

  // 2. If Supabase topics returned matching records, return them.
  if (topicsList.length > 0) {
    return topicsList;
  }

  // 3. Fall back to / augment with the student's curriculum topics
  // Filter for average score < 6 (confidenceScore * 2 < 6) or PYQ accuracy < 60%
  if (localSubjects && localSubjects.length > 0) {
    for (const sub of localSubjects) {
      for (const top of sub.topics) {
        const avgScore = Number(top.confidenceScore ? top.confidenceScore * 2 : 2);
        const pyqAcc = Number(top.pyqAccuracy || 0);

        if (avgScore < 6 || pyqAcc < 60) {
          const reason: 'low_score' | 'low_accuracy' | 'both' =
            avgScore < 6 && pyqAcc < 60 ? 'both' : avgScore < 6 ? 'low_score' : 'low_accuracy';

          topicsList.push({
            id: top.id,
            title: top.title,
            subjectId: sub.id,
            subjectName: sub.name,
            averageScore: avgScore,
            pyqAccuracy: pyqAcc,
            reason,
            status: top.status,
            weightageTier: top.weightageTier,
            pyqsSolved: top.pyqsSolved,
            pyqsTotal: top.pyqsTotal,
            subtopics: top.subtopics,
          });
        }
      }
    }
  }

  // Prioritize topics that fail BOTH criteria, then lowest accuracy
  return topicsList.sort((a, b) => {
    if (a.reason === 'both' && b.reason !== 'both') return -1;
    if (b.reason === 'both' && a.reason !== 'both') return 1;
    return a.pyqAccuracy - b.pyqAccuracy;
  });
}

/**
 * Deterministic UUID generator to produce consistent UUIDs for subjects, topics, and subtopics
 * based on their stable IDs or keys.
 */
export function getDeterministicUuid(seed: string): string {
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c64e6d;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  const hex =
    (hash1 >>> 0).toString(16).padStart(8, '0') +
    (hash2 >>> 0).toString(16).padStart(8, '0') +
    ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0') +
    ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface SyllabusSyncResult {
  success: boolean;
  subjectsSaved: number;
  topicsSaved: number;
  subtopicsSaved: number;
  isFromDatabase: boolean;
  message: string;
  error?: string;
}

export interface SyllabusLoadResult {
  subjects: Subject[];
  isFromDatabase: boolean;
  stats: { subjectsCount: number; topicsCount: number; subtopicsCount: number };
  message: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTopicStatus(status: string | null | undefined): TopicStatus {
  if (status === 'completed' || status === 'in_progress' || status === 'revision_due') {
    return status;
  }
  return 'unvisited';
}

function getWeightageTier(tier: string | null | undefined): Topic['weightageTier'] {
  if (tier === 'Critical (High)' || tier === 'Core (Medium)') return tier;
  return 'Foundational';
}

/** Saves the current user's frontend-created syllabus in parent-first order. */
export async function saveSyllabusToDatabase(
  subjects: Subject[],
  ownerId: string
): Promise<SyllabusSyncResult> {
  let subjectsSaved = 0;
  let topicsSaved = 0;
  let subtopicsSaved = 0;

  const failure = (message: string): SyllabusSyncResult => ({
    success: false,
    subjectsSaved,
    topicsSaved,
    subtopicsSaved,
    isFromDatabase: false,
    message,
    error: message,
  });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return failure(`Could not verify Supabase session: ${sessionError.message}`);
  if (!session || session.user.id !== ownerId) {
    return failure('Sign in with the account that owns this syllabus before saving.');
  }

  const dbSubjects: Array<{ id: string; owner_id: string; name: string; code: string; sort_order: number }> = [];
  const dbTopics: Array<{
    id: string;
    owner_id: string;
    subject_id: string;
    name: string;
    sort_order: number;
  }> = [];
  const dbSubtopics: Array<{
    id: string;
    owner_id: string;
    topic_id: string;
    name: string;
    sort_order: number;
  }> = [];

  subjects.forEach((subject, subjectIndex) => {
    const subjectId = UUID_PATTERN.test(subject.id)
      ? subject.id
      : getDeterministicUuid(`sub_${subject.id}`);

    dbSubjects.push({
      id: subjectId,
      owner_id: ownerId,
      name: subject.name,
      code: subject.shortCode || subject.id,
      sort_order: subjectIndex,
    });

    subject.topics.forEach((topic, topicIndex) => {
      const topicId = UUID_PATTERN.test(topic.id)
        ? topic.id
        : getDeterministicUuid(`top_${topic.id}`);

      dbTopics.push({
        id: topicId,
        owner_id: ownerId,
        subject_id: subjectId,
        name: topic.title,
        sort_order: topicIndex,
      });

      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        const existingItem = topic.subtopicItems?.[subtopicIndex];
        const subtopicId =
          existingItem && UUID_PATTERN.test(existingItem.id)
            ? existingItem.id
            : getDeterministicUuid(`subtop_${topic.id}_${subtopicIndex}`);

        dbSubtopics.push({
          id: subtopicId,
          owner_id: ownerId,
          topic_id: topicId,
          name: subtopic,
          sort_order: subtopicIndex,
        });
      });
    });
  });

  if (dbSubjects.length > 0) {
    const { data, error } = await supabase
      .from('subjects')
      .upsert(dbSubjects, { onConflict: 'id' })
      .select('id');
    if (error) return failure(`Could not save subjects: ${error.message}`);
    subjectsSaved = data?.length || 0;
  }

  if (dbTopics.length > 0) {
    const { data, error } = await supabase
      .from('topics')
      .upsert(dbTopics, { onConflict: 'id' })
      .select('id');
    if (error) return failure(`Could not save topics: ${error.message}`);
    topicsSaved = data?.length || 0;
  }

  if (dbSubtopics.length > 0) {
    const { data, error } = await supabase
      .from('subtopics')
      .upsert(dbSubtopics, { onConflict: 'id' })
      .select('id');
    if (error) return failure(`Could not save subtopics: ${error.message}`);
    subtopicsSaved = data?.length || 0;
  }

  return {
    success: true,
    subjectsSaved,
    topicsSaved,
    subtopicsSaved,
    isFromDatabase: true,
    message: `Saved ${subjectsSaved} subjects, ${topicsSaved} topics, and ${subtopicsSaved} subtopics.`,
  };
}

/** Loads only the signed-in user's syllabus; an empty result is a valid blank start. */
export async function fetchSyllabusFromDatabase(ownerId: string): Promise<SyllabusLoadResult> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Could not verify Supabase session: ${sessionError.message}`);
  if (!session || session.user.id !== ownerId) {
    throw new Error('An active Supabase session for this account is required to load its syllabus.');
  }

  const [subjectResult, topicResult, subtopicResult] = await Promise.all([
    supabase.from('subjects').select('id, owner_id, name, code, sort_order')
      .order('sort_order', { ascending: true }),
    supabase.from('topics').select('id, owner_id, subject_id, name, sort_order, average_score, score, confidence_score, pyq_accuracy, accuracy, status, weightage_tier, pyqs_solved, pyqs_total')
      .order('sort_order', { ascending: true }),
    supabase.from('subtopics').select('id, owner_id, topic_id, name, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  const queryError = subjectResult.error || topicResult.error || subtopicResult.error;
  if (queryError) throw new Error(`Could not load syllabus: ${queryError.message}`);

  const dbSubjects = subjectResult.data || [];
  const dbTopics = topicResult.data || [];
  const dbSubtopics = subtopicResult.data || [];
  const topicsBySubject = new Map<string, typeof dbTopics>();
  const subtopicsByTopic = new Map<string, typeof dbSubtopics>();

  dbTopics.forEach((topic) => {
    const rows = topicsBySubject.get(topic.subject_id) || [];
    rows.push(topic);
    topicsBySubject.set(topic.subject_id, rows);
  });
  dbSubtopics.forEach((subtopic) => {
    const rows = subtopicsByTopic.get(subtopic.topic_id) || [];
    rows.push(subtopic);
    subtopicsByTopic.set(subtopic.topic_id, rows);
  });

  const loadedSubjects: Subject[] = dbSubjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    shortCode: subject.code,
    weightageMarks: '',
    approxQuestions: 0,
    color: '#4f46e5',
    bgLight: '#eef2ff',
    borderColor: '#c7d2fe',
    description: '',
    recommendedBooks: [],
    topics: (topicsBySubject.get(subject.id) || []).map((topic) => {
      const rawSubtopics = subtopicsByTopic.get(topic.id) || [];
      const subtopicItems: SubtopicItem[] = rawSubtopics.map((subtopic, idx) => ({
        id: subtopic.id,
        topicId: topic.id,
        name: subtopic.name,
        sortOrder: typeof subtopic.sort_order === 'number' ? subtopic.sort_order : idx,
      }));

      return {
        id: topic.id,
        subjectId: subject.id,
        title: topic.name,
        subtopics: subtopicItems.map((s) => s.name),
        subtopicItems,
        weightageTier: getWeightageTier(topic.weightage_tier),
        status: getTopicStatus(topic.status),
        confidenceScore: Number(topic.confidence_score ?? 3),
        pyqsTotal: Number(topic.pyqs_total ?? 0),
        pyqsSolved: Number(topic.pyqs_solved ?? 0),
        pyqAccuracy: Number(topic.pyq_accuracy ?? topic.accuracy ?? 0),
        formulas: [],
        commonTraps: [],
      };
    }),
  }));

  return {
    subjects: loadedSubjects,
    isFromDatabase: true,
    stats: {
      subjectsCount: dbSubjects.length,
      topicsCount: dbTopics.length,
      subtopicsCount: dbSubtopics.length,
    },
    message: dbSubjects.length
      ? `Loaded ${dbSubjects.length} subjects, ${dbTopics.length} topics, and ${dbSubtopics.length} subtopics.`
      : 'No syllabus entries yet. Add your first subject from the Subjects page.',
  };
}

/**
 * Fetches the authenticated user's role from public.profiles.
 */
export async function fetchUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error || !data) return 'student';
    if (data.role === 'admin' || data.role === 'content_manager' || data.role === 'student') {
      return data.role;
    }
    return 'student';
  } catch {
    return 'student';
  }
}

/**
 * Check whether the given user is currently blocked by an administrator.
 */
export async function fetchUserBlockStatus(
  userId: string
): Promise<{ isBlocked: boolean; reason?: string | null }> {
  if (!UUID_PATTERN.test(userId)) return { isBlocked: false };
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_my_block_status');
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return {
        isBlocked: Boolean(rpcData[0]?.is_blocked),
        reason: rpcData[0]?.blocked_reason ?? null,
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_blocked, blocked_reason')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      return { isBlocked: false };
    }
    return {
      isBlocked: Boolean(data?.is_blocked),
      reason: typeof data?.blocked_reason === 'string' ? data.blocked_reason : null,
    };
  } catch {
    return { isBlocked: false };
  }
}

/**
 * Admin: Fetch all user profiles for role delegation and user moderation.
 */
export async function fetchAllManagedProfiles(): Promise<{
  profiles: ManagedUserProfile[];
  error?: string;
}> {
  try {
    const primary = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at, is_blocked, blocked_at, blocked_reason')
      .order('created_at', { ascending: true });

    let rows: any[] | null = primary.data;
    let queryError = primary.error;

    // Graceful fallback if block columns migration has not yet been applied
    if (
      queryError &&
      (queryError.code === '42703' || (queryError.message || '').toLowerCase().includes('is_blocked'))
    ) {
      const fallback = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: true });
      rows = fallback.data;
      queryError = fallback.error;
    }

    if (queryError) return { profiles: [], error: queryError.message };
    return {
      profiles: (rows || []).map((row) => ({
        id: row.id,
        fullName: row.full_name || 'Aspirant',
        role: (row.role === 'admin' || row.role === 'content_manager' ? row.role : 'student') as UserRole,
        createdAt: row.created_at || new Date().toISOString(),
        isBlocked: Boolean(row.is_blocked),
        blockedAt: row.blocked_at ?? null,
        blockedReason: row.blocked_reason ?? null,
      })),
    };
  } catch (err: any) {
    return { profiles: [], error: err?.message || 'Failed to load user profiles.' };
  }
}

/**
 * Admin: Update a user's role (student | content_manager | admin).
 */
export async function updateManagedUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update user role.' };
  }
}

/**
 * Admin: Block or unblock a user account so blocked users cannot sign in.
 */
export async function setManagedUserBlocked(
  targetUserId: string,
  blocked: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanReason = reason?.trim() || null;
    const { error } = await supabase.rpc('admin_set_user_blocked', {
      p_target_user_id: targetUserId,
      p_blocked: blocked,
      p_reason: cleanReason,
    });
    if (error) {
      if (error.code === 'PGRST202') {
        return {
          success: false,
          error:
            'Run the latest SQL migration (supabase/migrations/20261123_admin_security_controls.sql) in Supabase SQL Editor to enable user blocking.',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update user block status.' };
  }
}

/**
 * Hierarchy CRUD & Reordering Helpers (Supabase-backed with cascade safety)
 */
export async function updateSubjectInDb(
  subjectId: string,
  updates: { name?: string; code?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(subjectId)) return { success: true };
  try {
    const { error } = await supabase.from('subjects').update(updates).eq('id', subjectId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update subject.' };
  }
}

export async function deleteSubjectInDb(
  subjectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(subjectId)) return { success: true };
  try {
    const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete subject.' };
  }
}

export async function updateTopicInDb(
  topicId: string,
  updates: { name?: string; weightage_tier?: string; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(topicId)) return { success: true };
  try {
    const { error } = await supabase.from('topics').update(updates).eq('id', topicId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update topic.' };
  }
}

export async function deleteTopicInDb(
  topicId: string
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(topicId)) return { success: true };
  try {
    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete topic.' };
  }
}

export async function reorderTopicsInDb(
  orderedTopicIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const validPairs = orderedTopicIds
      .map((id, index) => ({ id, sort_order: index }))
      .filter((item) => UUID_PATTERN.test(item.id));

    await Promise.all(
      validPairs.map((item) =>
        supabase.from('topics').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reorder topics.' };
  }
}

export async function updateSubtopicInDb(
  subtopicId: string,
  updates: { name?: string; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(subtopicId)) return { success: true };
  try {
    const { error } = await supabase.from('subtopics').update(updates).eq('id', subtopicId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update subtopic.' };
  }
}

export async function deleteSubtopicInDb(
  subtopicId: string
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(subtopicId)) return { success: true };
  try {
    const { error } = await supabase.from('subtopics').delete().eq('id', subtopicId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete subtopic.' };
  }
}

export async function reorderSubtopicsInDb(
  orderedSubtopicIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const validPairs = orderedSubtopicIds
      .map((id, index) => ({ id, sort_order: index }))
      .filter((item) => UUID_PATTERN.test(item.id));

    await Promise.all(
      validPairs.map((item) =>
        supabase.from('subtopics').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reorder subtopics.' };
  }
}

