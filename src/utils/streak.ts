import { LevelTest, MockTest, StreakDayStatus, StudyStreakInfo, Subject, Task, TestAttempt } from '../types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Formats a Date into local calendar YYYY-MM-DD (avoids UTC midnight shift bugs).
 */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's local YYYY-MM-DD date key.
 */
export function getTodayLocalDateKey(): string {
  return formatLocalDateKey(new Date());
}

/**
 * Normalizes a YYYY-MM-DD string or ISO timestamp into a local YYYY-MM-DD key.
 */
export function toLocalDateKey(input?: string | Date | null): string | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : formatLocalDateKey(input);
  }
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatLocalDateKey(parsed);
}

function addDaysToKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
  return formatLocalDateKey(dt);
}

function getDayLetterFromKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return DAY_LETTERS[dt.getDay()] || '•';
}

/**
 * Computes real Consistent Streak metrics from all recorded study activities:
 * - Persisted `activeStudyDates`
 * - Completed tasks (`tasks`)
 * - Test attempts (`testAttempts`)
 * - Tests created by the user (`levelTests`)
 * - Logged mock tests (`mockTests`)
 * - Revised/completed topics (`subjects`)
 */
export function computeStudyStreak(params: {
  activeStudyDates?: string[];
  tasks: Task[];
  testAttempts: TestAttempt[];
  levelTests: LevelTest[];
  mockTests: MockTest[];
  subjects: Subject[];
  currentUserId?: string;
}): StudyStreakInfo {
  const {
    activeStudyDates = [],
    tasks,
    testAttempts,
    levelTests,
    mockTests,
    subjects,
    currentUserId,
  } = params;

  const todayKey = getTodayLocalDateKey();
  const yesterdayKey = addDaysToKey(todayKey, -1);
  const dateSet = new Set<string>();

  const addIfValid = (raw?: string | null) => {
    const key = toLocalDateKey(raw);
    if (key && key <= todayKey) {
      dateSet.add(key);
    }
  };

  activeStudyDates.forEach((d) => addIfValid(d));

  tasks.forEach((t) => {
    if (t.completed) addIfValid(t.date);
  });

  testAttempts.forEach((a) => {
    addIfValid(a.completedAt);
  });

  if (currentUserId) {
    levelTests.forEach((t) => {
      if (t.createdBy === currentUserId) {
        addIfValid(t.createdAt);
      }
    });
  }

  mockTests.forEach((m) => {
    addIfValid(m.date);
  });

  subjects.forEach((s) => {
    s.topics.forEach((topic) => {
      if (topic.lastRevised) addIfValid(topic.lastRevised);
    });
  });

  const studiedToday = dateSet.has(todayKey);

  // Current streak: count backwards from today (if active today) OR from yesterday (grace window while today is still ongoing)
  let currentStreak = 0;
  let cursor: string | null = studiedToday
    ? todayKey
    : dateSet.has(yesterdayKey)
      ? yesterdayKey
      : null;

  while (cursor && dateSet.has(cursor)) {
    currentStreak += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  // Longest streak across all recorded dates
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const expectedNext = addDaysToKey(sortedDates[i - 1], 1);
      run = sortedDates[i] === expectedNext ? run + 1 : 1;
    }
    if (run > longestStreak) longestStreak = run;
  }

  // Build real last-7-days timeline (6 days ago → Today)
  const last7Days: StreakDayStatus[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const key = addDaysToKey(todayKey, offset);
    last7Days.push({
      dateKey: key,
      dayShort: getDayLetterFromKey(key),
      isToday: offset === 0,
      active: dateSet.has(key),
    });
  }

  return {
    currentStreak,
    longestStreak,
    studiedToday,
    last7Days,
    activeDatesCount: dateSet.size,
  };
}
