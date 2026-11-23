import { supabase } from './supabase';
import {
  StudyNote,
  LevelTest,
  TestQuestion,
  TestAttempt,
  NoteEntityType,
  NoteType,
  CorrectOptionKey,
  TestDifficulty,
} from '../types';
import { sanitizeEducationalHtml } from '../utils/htmlSanitizer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOCAL_NOTES_KEY = 'gate_da_hierarchical_study_notes_v1';
const LOCAL_TESTS_KEY = 'gate_da_hierarchical_level_tests_v1';
const LOCAL_QUESTIONS_KEY = 'gate_da_hierarchical_test_questions_v1';
const LOCAL_ATTEMPTS_KEY = 'gate_da_hierarchical_test_attempts_v1';

export interface ServiceResult<T> {
  data: T;
  error?: string;
  usingLocalFallback?: boolean;
}

const inMemoryLocalState = new Map<string, unknown>();

function readLocal<T>(key: string, fallback: T): T {
  return (inMemoryLocalState.get(key) as T | undefined) || fallback;
}

function writeLocal<T>(key: string, value: T): void {
  inMemoryLocalState.set(key, value);
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist')
  );
}

async function hasLiveSupabaseSession(isDemo?: boolean): Promise<{
  live: boolean;
  userId?: string;
}> {
  if (isDemo) return { live: false };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.id) {
      return { live: true, userId: data.session.user.id };
    }
  } catch {
    // fallback
  }
  return { live: false };
}

function mapDbNote(row: any): StudyNote {
  return {
    id: row.id,
    ownerId: row.owner_id ?? null,
    entityType: row.entity_type,
    entityId: row.entity_id,
    subjectId: row.subject_id,
    topicId: row.topic_id ?? null,
    subtopicId: row.subtopic_id ?? null,
    noteType: row.note_type,
    title: row.title,
    htmlContent: row.html_content,
    sanitizedVersion: row.sanitized_version ?? 1,
    updatedBy: row.updated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbTest(
  row: any,
  questionCount?: number,
  creatorName?: string,
  attemptCount?: number
): LevelTest {
  return {
    id: row.id,
    createdBy: row.created_by,
    creatorName: creatorName || row.creator_name || undefined,
    entityType: row.entity_type,
    entityId: row.entity_id,
    subjectId: row.subject_id,
    topicId: row.topic_id ?? null,
    subtopicId: row.subtopic_id ?? null,
    title: row.title,
    description: row.description || '',
    durationMinutes: Number(row.duration_minutes ?? 20),
    passingPercentage: Number(row.passing_percentage ?? 40),
    isActive: Boolean(row.is_active),
    questionCount:
      typeof questionCount === 'number'
        ? questionCount
        : Array.isArray(row.test_questions)
          ? row.test_questions[0]?.count ?? row.test_questions.length
          : 0,
    attemptCount: typeof attemptCount === 'number' ? attemptCount : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbQuestion(row: any): TestQuestion {
  return {
    id: row.id,
    testId: row.test_id,
    questionText: row.question_text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctAnswer: row.correct_answer as CorrectOptionKey,
    explanation: row.explanation || '',
    difficulty: (row.difficulty || 'medium') as TestDifficulty,
    questionImageUrl: row.question_image_url || undefined,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbAttempt(row: any): TestAttempt {
  return {
    id: row.id,
    testId: row.test_id,
    userId: row.user_id,
    answers: (row.answers_json || {}) as Record<string, CorrectOptionKey>,
    score: Number(row.score ?? 0),
    totalQuestions: Number(row.total_questions ?? 0),
    percentage: Number(row.percentage ?? 0),
    timeTakenSeconds: Number(row.time_taken_seconds ?? 0),
    completedAt: row.completed_at,
  };
}

// ============================================================================
// STUDY NOTES (Subject / Topic / Subtopic × Complete / Short)
// ============================================================================

export async function fetchAllStudyNotes(isDemo?: boolean): Promise<ServiceResult<StudyNote[]>> {
  const { live } = await hasLiveSupabaseSession(isDemo);
  if (!live) {
    return { data: readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []), usingLocalFallback: true };
  }

  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return {
        data: readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []),
        usingLocalFallback: true,
        error: 'Study notes are available in local workspace storage.',
      };
    }
    return { data: [], error: error.message };
  }

  return { data: (data || []).map(mapDbNote) };
}

export async function syncLocalStudyNotesToCloud(isDemo?: boolean): Promise<ServiceResult<number>> {
  const { live, userId } = await hasLiveSupabaseSession(isDemo);
  if (!live || !userId) {
    return { data: 0, usingLocalFallback: true };
  }

  const localNotes = readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []);
  let syncedCount = 0;

  for (const note of localNotes) {
    if (
      !UUID_REGEX.test(note.entityId) ||
      !UUID_REGEX.test(note.subjectId) ||
      (note.topicId && !UUID_REGEX.test(note.topicId)) ||
      (note.subtopicId && !UUID_REGEX.test(note.subtopicId))
    ) {
      continue;
    }

    const payload = {
      owner_id: userId,
      entity_type: note.entityType,
      entity_id: note.entityId,
      subject_id: note.subjectId,
      topic_id: note.topicId ?? null,
      subtopic_id: note.subtopicId ?? null,
      note_type: note.noteType,
      title: note.title,
      html_content: note.htmlContent,
      sanitized_version: note.sanitizedVersion || 1,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('study_notes')
      .upsert(payload, { onConflict: 'entity_type,entity_id,note_type' });

    if (!error) syncedCount++;
  }

  return { data: syncedCount };
}

export interface UpsertNoteInput {
  entityType: NoteEntityType;
  entityId: string;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  noteType: NoteType;
  title: string;
  rawHtml: string;
  userId?: string;
  isDemo?: boolean;
}

export async function upsertStudyNote(
  input: UpsertNoteInput
): Promise<ServiceResult<StudyNote | null>> {
  const { sanitizedHtml } = sanitizeEducationalHtml(input.rawHtml);
  if (!sanitizedHtml) {
    return { data: null, error: 'HTML content cannot be empty after sanitization.' };
  }

  const now = new Date().toISOString();
  const { live, userId } = await hasLiveSupabaseSession(input.isDemo);
  const canPersistToDb =
    live &&
    UUID_REGEX.test(input.entityId) &&
    UUID_REGEX.test(input.subjectId) &&
    (!input.topicId || UUID_REGEX.test(input.topicId)) &&
    (!input.subtopicId || UUID_REGEX.test(input.subtopicId));

  if (!canPersistToDb) {
    const existing = readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []);
    const idx = existing.findIndex(
      (n) =>
        n.entityType === input.entityType &&
        n.entityId === input.entityId &&
        n.noteType === input.noteType
    );
    const saved: StudyNote = {
      id: idx >= 0 ? existing[idx].id : generateId(),
      ownerId: input.userId || userId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      subjectId: input.subjectId,
      topicId: input.topicId ?? null,
      subtopicId: input.subtopicId ?? null,
      noteType: input.noteType,
      title: input.title.trim() || `${input.noteType === 'complete' ? 'Complete' : 'Short'} Notes`,
      htmlContent: sanitizedHtml,
      sanitizedVersion: 1,
      updatedBy: input.userId || userId || null,
      createdAt: idx >= 0 ? existing[idx].createdAt : now,
      updatedAt: now,
    };
    const next = idx >= 0 ? existing.map((n, i) => (i === idx ? saved : n)) : [saved, ...existing];
    writeLocal(LOCAL_NOTES_KEY, next);
    return { data: saved, usingLocalFallback: true };
  }

  const payload = {
    owner_id: userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    subject_id: input.subjectId,
    topic_id: input.entityType === 'subject' ? null : input.topicId ?? null,
    subtopic_id: input.entityType === 'subtopic' ? input.subtopicId ?? null : null,
    note_type: input.noteType,
    title: input.title.trim() || `${input.noteType === 'complete' ? 'Complete' : 'Short'} Notes`,
    html_content: sanitizedHtml,
    sanitized_version: 1,
    updated_by: userId,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('study_notes')
    .upsert(payload, { onConflict: 'entity_type,entity_id,note_type' })
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return upsertStudyNote({ ...input, isDemo: true });
    }
    return { data: null, error: error.message };
  }

  return { data: mapDbNote(data) };
}

export async function deleteStudyNote(
  noteId: string,
  isDemo?: boolean
): Promise<ServiceResult<boolean>> {
  const { live } = await hasLiveSupabaseSession(isDemo);
  if (!live || !UUID_REGEX.test(noteId)) {
    const existing = readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []);
    writeLocal(
      LOCAL_NOTES_KEY,
      existing.filter((n) => n.id !== noteId)
    );
    return { data: true, usingLocalFallback: true };
  }

  const { error } = await supabase.from('study_notes').delete().eq('id', noteId);
  if (error) {
    if (isMissingTableError(error)) {
      const existing = readLocal<StudyNote[]>(LOCAL_NOTES_KEY, []);
      writeLocal(
        LOCAL_NOTES_KEY,
        existing.filter((n) => n.id !== noteId)
      );
      return { data: true, usingLocalFallback: true };
    }
    return { data: false, error: error.message };
  }

  return { data: true };
}

// ============================================================================
// LEVEL TESTS (Optional Tests at Subject / Topic / Subtopic)
// ============================================================================

export async function fetchAllLevelTests(isDemo?: boolean): Promise<ServiceResult<LevelTest[]>> {
  const { live } = await hasLiveSupabaseSession(isDemo);
  if (!live) {
    const tests = readLocal<LevelTest[]>(LOCAL_TESTS_KEY, []);
    const questions = readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []);
    const attempts = readLocal<TestAttempt[]>(LOCAL_ATTEMPTS_KEY, []);
    const countMap = new Map<string, number>();
    questions.forEach((q) => countMap.set(q.testId, (countMap.get(q.testId) || 0) + 1));
    const attemptCountMap = new Map<string, number>();
    attempts.forEach((a) => attemptCountMap.set(a.testId, (attemptCountMap.get(a.testId) || 0) + 1));
    return {
      data: tests.map((t) => ({
        ...t,
        questionCount: countMap.get(t.id) || 0,
        attemptCount: attemptCountMap.get(t.id) || 0,
      })),
      usingLocalFallback: true,
    };
  }

  const { data, error } = await supabase
    .from('level_tests')
    .select('*, test_questions(count)')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      const tests = readLocal<LevelTest[]>(LOCAL_TESTS_KEY, []);
      const questions = readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []);
      const attempts = readLocal<TestAttempt[]>(LOCAL_ATTEMPTS_KEY, []);
      const countMap = new Map<string, number>();
      questions.forEach((q) => countMap.set(q.testId, (countMap.get(q.testId) || 0) + 1));
      const attemptCountMap = new Map<string, number>();
      attempts.forEach((a) => attemptCountMap.set(a.testId, (attemptCountMap.get(a.testId) || 0) + 1));
      return {
        data: tests.map((t) => ({
          ...t,
          questionCount: countMap.get(t.id) || 0,
          attemptCount: attemptCountMap.get(t.id) || 0,
        })),
        usingLocalFallback: true,
        error: 'Level tests are available in local workspace storage.',
      };
    }
    return { data: [], error: error.message };
  }

  const rows = data || [];
  const creatorIds = Array.from(
    new Set(rows.map((r: any) => r.created_by).filter((id: unknown): id is string => typeof id === 'string' && UUID_REGEX.test(id)))
  );

  const creatorNameMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds);
      (profilesData || []).forEach((p: any) => {
        if (p?.id && p?.full_name) {
          creatorNameMap.set(p.id, p.full_name);
        }
      });
    } catch {
      // Non-fatal: fallback to anonymous/ID label in UI
    }
  }

  const attemptCountMap = new Map<string, number>();
  try {
    const { data: attemptRows, error: attemptCountError } = await supabase.rpc(
      'get_level_test_attempt_counts'
    );
    if (!attemptCountError && Array.isArray(attemptRows)) {
      attemptRows.forEach((r: any) => {
        if (r?.test_id) {
          attemptCountMap.set(r.test_id, Number(r.attempt_count ?? 0));
        }
      });
    }
  } catch {
    // Non-fatal fallback if migration hasn't been run yet
  }

  return {
    data: rows.map((row: any) =>
      mapDbTest(
        row,
        undefined,
        creatorNameMap.get(row.created_by),
        attemptCountMap.get(row.id) ?? 0
      )
    ),
  };
}

export interface CreateTestInput {
  entityType: NoteEntityType;
  entityId: string;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  title: string;
  description?: string;
  durationMinutes: number;
  passingPercentage: number;
  isActive: boolean;
  userId?: string;
  creatorName?: string;
  isDemo?: boolean;
}

export async function createLevelTest(
  input: CreateTestInput
): Promise<ServiceResult<LevelTest | null>> {
  const now = new Date().toISOString();
  const { live, userId } = await hasLiveSupabaseSession(input.isDemo);
  const canPersistToDb =
    live &&
    userId &&
    UUID_REGEX.test(input.entityId) &&
    UUID_REGEX.test(input.subjectId) &&
    (!input.topicId || UUID_REGEX.test(input.topicId)) &&
    (!input.subtopicId || UUID_REGEX.test(input.subtopicId));

  if (!canPersistToDb) {
    const newTest: LevelTest = {
      id: generateId(),
      createdBy: input.userId || userId || 'demo_user',
      creatorName: input.creatorName || 'You',
      entityType: input.entityType,
      entityId: input.entityId,
      subjectId: input.subjectId,
      topicId: input.entityType === 'subject' ? null : input.topicId ?? null,
      subtopicId: input.entityType === 'subtopic' ? input.subtopicId ?? null : null,
      title: input.title.trim(),
      description: (input.description || '').trim(),
      durationMinutes: Math.max(1, Math.min(240, Math.round(input.durationMinutes || 20))),
      passingPercentage: Math.max(0, Math.min(100, Number(input.passingPercentage ?? 40))),
      isActive: input.isActive,
      questionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const existing = readLocal<LevelTest[]>(LOCAL_TESTS_KEY, []);
    writeLocal(LOCAL_TESTS_KEY, [newTest, ...existing]);
    return { data: newTest, usingLocalFallback: true };
  }

  const { data, error } = await supabase
    .from('level_tests')
    .insert({
      created_by: userId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      subject_id: input.subjectId,
      topic_id: input.entityType === 'subject' ? null : input.topicId ?? null,
      subtopic_id: input.entityType === 'subtopic' ? input.subtopicId ?? null : null,
      title: input.title.trim(),
      description: (input.description || '').trim(),
      duration_minutes: Math.max(1, Math.min(240, Math.round(input.durationMinutes || 20))),
      passing_percentage: Math.max(0, Math.min(100, Number(input.passingPercentage ?? 40))),
      is_active: input.isActive,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return createLevelTest({ ...input, isDemo: true });
    }
    return { data: null, error: error.message };
  }

  return { data: mapDbTest(data, 0, input.creatorName) };
}

export async function updateLevelTest(
  testId: string,
  patch: Partial<Pick<LevelTest, 'title' | 'description' | 'durationMinutes' | 'passingPercentage' | 'isActive'>>,
  isDemo?: boolean
): Promise<ServiceResult<LevelTest | null>> {
  const now = new Date().toISOString();
  const { live } = await hasLiveSupabaseSession(isDemo);

  if (!live || !UUID_REGEX.test(testId)) {
    const existing = readLocal<LevelTest[]>(LOCAL_TESTS_KEY, []);
    let updated: LevelTest | null = null;
    const next = existing.map((t) => {
      if (t.id !== testId) return t;
      updated = { ...t, ...patch, updatedAt: now };
      return updated;
    });
    writeLocal(LOCAL_TESTS_KEY, next);
    return { data: updated, usingLocalFallback: true };
  }

  const dbPatch: Record<string, unknown> = { updated_at: now };
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.description !== undefined) dbPatch.description = patch.description.trim();
  if (patch.durationMinutes !== undefined) dbPatch.duration_minutes = patch.durationMinutes;
  if (patch.passingPercentage !== undefined) dbPatch.passing_percentage = patch.passingPercentage;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;

  const { data, error } = await supabase
    .from('level_tests')
    .update(dbPatch)
    .eq('id', testId)
    .select('*, test_questions(count)')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return updateLevelTest(testId, patch, true);
    }
    return { data: null, error: error.message };
  }

  return { data: mapDbTest(data) };
}

export async function deleteLevelTest(
  testId: string,
  isDemo?: boolean,
  options?: { isAdmin?: boolean; knownAttemptCount?: number }
): Promise<ServiceResult<boolean>> {
  if (options?.isAdmin === false) {
    return {
      data: false,
      error: 'Only administrators can delete tests.',
    };
  }

  if ((options?.knownAttemptCount ?? 0) > 0) {
    return {
      data: false,
      error: 'This test cannot be deleted because one or more users have already attempted it.',
    };
  }

  const { live } = await hasLiveSupabaseSession(isDemo);

  if (!live || !UUID_REGEX.test(testId)) {
    const localAttempts = readLocal<TestAttempt[]>(LOCAL_ATTEMPTS_KEY, []).filter(
      (a) => a.testId === testId
    );
    if (localAttempts.length > 0) {
      return {
        data: false,
        error: 'This test cannot be deleted because it has already been attempted.',
        usingLocalFallback: true,
      };
    }

    writeLocal(
      LOCAL_TESTS_KEY,
      readLocal<LevelTest[]>(LOCAL_TESTS_KEY, []).filter((t) => t.id !== testId)
    );
    writeLocal(
      LOCAL_QUESTIONS_KEY,
      readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []).filter((q) => q.testId !== testId)
    );
    return { data: true, usingLocalFallback: true };
  }

  // Primary path: SECURITY DEFINER RPC enforcing admin role + zero attempts across ALL users
  const { error: rpcError } = await supabase.rpc('admin_delete_level_test', {
    p_test_id: testId,
  });

  if (!rpcError) {
    return { data: true };
  }

  // If the new migration has not been applied yet, fall back cleanly with an attempt check
  if (rpcError.code === 'PGRST202') {
    const { count, error: countError } = await supabase
      .from('test_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', testId);

    if (!countError && (count ?? 0) > 0) {
      return {
        data: false,
        error: 'This test cannot be deleted because one or more users have already attempted it.',
      };
    }

    const { error } = await supabase.from('level_tests').delete().eq('id', testId);
    if (error) {
      if (isMissingTableError(error)) {
        return deleteLevelTest(testId, true, options);
      }
      return { data: false, error: error.message };
    }
    return { data: true };
  }

  if (isMissingTableError(rpcError)) {
    return deleteLevelTest(testId, true, options);
  }

  return { data: false, error: rpcError.message };
}

// ============================================================================
// TEST QUESTIONS (CSV/Excel Batch Import & Individual CRUD)
// ============================================================================

export async function fetchQuestionsForTest(
  testId: string,
  isDemo?: boolean
): Promise<ServiceResult<TestQuestion[]>> {
  const { live } = await hasLiveSupabaseSession(isDemo);

  if (!live || !UUID_REGEX.test(testId)) {
    const all = readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []);
    return {
      data: all.filter((q) => q.testId === testId).sort((a, b) => a.sortOrder - b.sortOrder),
      usingLocalFallback: true,
    };
  }

  const { data, error } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', testId)
    .order('sort_order', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return fetchQuestionsForTest(testId, true);
    }
    return { data: [], error: error.message };
  }

  return { data: (data || []).map(mapDbQuestion) };
}

export interface QuestionPayloadInput {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOptionKey;
  explanation?: string;
  difficulty?: TestDifficulty;
  questionImageUrl?: string;
}

export async function saveImportedQuestions(
  testId: string,
  questions: QuestionPayloadInput[],
  mode: 'append' | 'replace' = 'append',
  isDemo?: boolean
): Promise<ServiceResult<TestQuestion[]>> {
  if (!questions.length) {
    return { data: [], error: 'No valid questions to import.' };
  }

  const now = new Date().toISOString();
  const { live } = await hasLiveSupabaseSession(isDemo);

  if (!live || !UUID_REGEX.test(testId)) {
    const all = readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []);
    const existingForTest = mode === 'replace' ? [] : all.filter((q) => q.testId === testId);
    const otherTests = all.filter((q) => q.testId !== testId);
    const startOrder = existingForTest.length;

    const created: TestQuestion[] = questions.map((q, idx) => ({
      id: generateId(),
      testId,
      questionText: q.questionText.trim(),
      optionA: q.optionA.trim(),
      optionB: q.optionB.trim(),
      optionC: q.optionC.trim(),
      optionD: q.optionD.trim(),
      correctAnswer: q.correctAnswer,
      explanation: (q.explanation || '').trim(),
      difficulty: q.difficulty || 'medium',
      questionImageUrl: q.questionImageUrl?.trim() || undefined,
      sortOrder: startOrder + idx,
      createdAt: now,
      updatedAt: now,
    }));

    const combinedForTest = [...existingForTest, ...created];
    writeLocal(LOCAL_QUESTIONS_KEY, [...otherTests, ...combinedForTest]);
    return { data: combinedForTest, usingLocalFallback: true };
  }

  if (mode === 'replace') {
    const { error: delError } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId);
    if (delError) {
      if (isMissingTableError(delError)) {
        return saveImportedQuestions(testId, questions, mode, true);
      }
      return { data: [], error: delError.message };
    }
  }

  // Determine starting sort_order
  const { data: existingRows } = await supabase
    .from('test_questions')
    .select('sort_order')
    .eq('test_id', testId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const startOrder = existingRows && existingRows.length > 0 ? Number(existingRows[0].sort_order) + 1 : 0;

  const insertPayload = questions.map((q, idx) => ({
    test_id: testId,
    question_text: q.questionText.trim(),
    option_a: q.optionA.trim(),
    option_b: q.optionB.trim(),
    option_c: q.optionC.trim(),
    option_d: q.optionD.trim(),
    correct_answer: q.correctAnswer,
    explanation: (q.explanation || '').trim(),
    difficulty: q.difficulty || 'medium',
    question_image_url: q.questionImageUrl?.trim() || null,
    sort_order: startOrder + idx,
  }));

  const { error: insertError } = await supabase.from('test_questions').insert(insertPayload);
  if (insertError) {
    if (isMissingTableError(insertError)) {
      return saveImportedQuestions(testId, questions, mode, true);
    }
    return { data: [], error: insertError.message };
  }

  return fetchQuestionsForTest(testId, isDemo);
}

export async function deleteTestQuestion(
  questionId: string,
  isDemo?: boolean
): Promise<ServiceResult<boolean>> {
  const { live } = await hasLiveSupabaseSession(isDemo);

  if (!live || !UUID_REGEX.test(questionId)) {
    writeLocal(
      LOCAL_QUESTIONS_KEY,
      readLocal<TestQuestion[]>(LOCAL_QUESTIONS_KEY, []).filter((q) => q.id !== questionId)
    );
    return { data: true, usingLocalFallback: true };
  }

  const { error } = await supabase.from('test_questions').delete().eq('id', questionId);
  if (error) {
    if (isMissingTableError(error)) {
      return deleteTestQuestion(questionId, true);
    }
    return { data: false, error: error.message };
  }

  return { data: true };
}

// ============================================================================
// TEST ATTEMPTS & ATTEMPT HISTORY
// ============================================================================

export async function fetchTestAttempts(
  userId?: string,
  testId?: string,
  isDemo?: boolean
): Promise<ServiceResult<TestAttempt[]>> {
  const { live, userId: sessionUid } = await hasLiveSupabaseSession(isDemo);
  const uid = sessionUid || userId || 'demo_user';

  if (!live) {
    const all = readLocal<TestAttempt[]>(LOCAL_ATTEMPTS_KEY, []);
    return {
      data: all
        .filter((a) => (!testId || a.testId === testId) && a.userId === uid)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
      usingLocalFallback: true,
    };
  }

  let query = supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', uid)
    .order('completed_at', { ascending: false });

  if (testId && UUID_REGEX.test(testId)) {
    query = query.eq('test_id', testId);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return fetchTestAttempts(userId, testId, true);
    }
    return { data: [], error: error.message };
  }

  return { data: (data || []).map(mapDbAttempt) };
}

export async function submitTestAttempt(
  input: {
    testId: string;
    answers: Record<string, CorrectOptionKey>;
    score: number;
    totalQuestions: number;
    timeTakenSeconds: number;
    userId?: string;
    isDemo?: boolean;
  }
): Promise<ServiceResult<TestAttempt | null>> {
  const percentage =
    input.totalQuestions > 0
      ? Math.round((input.score / input.totalQuestions) * 1000) / 10
      : 0;
  const now = new Date().toISOString();
  const { live, userId: sessionUid } = await hasLiveSupabaseSession(input.isDemo);
  const uid = sessionUid || input.userId || 'demo_user';

  if (!live || !UUID_REGEX.test(input.testId)) {
    const attempt: TestAttempt = {
      id: generateId(),
      testId: input.testId,
      userId: uid,
      answers: input.answers,
      score: input.score,
      totalQuestions: input.totalQuestions,
      percentage,
      timeTakenSeconds: input.timeTakenSeconds,
      completedAt: now,
    };
    const all = readLocal<TestAttempt[]>(LOCAL_ATTEMPTS_KEY, []);
    writeLocal(LOCAL_ATTEMPTS_KEY, [attempt, ...all]);
    return { data: attempt, usingLocalFallback: true };
  }

  const { data, error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: input.testId,
      user_id: uid,
      answers_json: input.answers,
      score: input.score,
      total_questions: input.totalQuestions,
      percentage,
      time_taken_seconds: input.timeTakenSeconds,
      completed_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return submitTestAttempt({ ...input, isDemo: true });
    }
    return { data: null, error: error.message };
  }

  return { data: mapDbAttempt(data) };
}
