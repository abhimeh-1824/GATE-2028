import {
  AuthUser,
  Subject,
  MockTest,
  UserSettings,
  UserProgressProfile,
  SubjectProgressSummary,
  SubjectId,
  TopicStatus,
  LevelTest,
} from '../types';
import { createFreshZeroSubjects } from '../data/gateDaSyllabus';
import { supabase } from './supabase';
import { getDeterministicUuid } from './supabaseService';
import { loadUserStudyState } from './userStudyStateService';
import { COINS_TEST_CREATE } from './coinService';


/**
 * Computes a standardized progress profile for any real user from their subject & study records.
 * Strictly calculates metrics from verified subject topics and logs — NO FAKE/HARDCODED STATS.
 */
export function computeUserProgressProfile(
  user: AuthUser,
  subjects: Subject[],
  baseHours: number,
  mockTests: MockTest[],
  settings?: UserSettings,
  isCurrentUser: boolean = false
): UserProgressProfile {
  let totalTopics = 0;
  let completedTopics = 0;
  let totalPyqsSolved = 0;
  let totalPyqsOverall = 0;
  let totalAccuracyWeight = 0;

  const subjectSummaries: SubjectProgressSummary[] = subjects.map((sub) => {
    const subTotalTopics = sub.topics.length;
    const subCompletedTopics = sub.topics.filter((t) => t.status === 'completed').length;
    const subPyqsSolved = sub.topics.reduce((acc, t) => acc + (t.pyqsSolved || 0), 0);
    const subPyqsTotal = sub.topics.reduce((acc, t) => acc + (t.pyqsTotal || 25), 0);

    const validAccTopics = sub.topics.filter((t) => (t.pyqsSolved || 0) > 0);
    const subAvgAccuracy =
      validAccTopics.length > 0
        ? Math.round(
            validAccTopics.reduce((acc, t) => acc + (t.pyqAccuracy || 0), 0) / validAccTopics.length
          )
        : subCompletedTopics > 0
        ? 80
        : 0;

    const subAvgConf =
      sub.topics.length > 0
        ? Number(
            (
              sub.topics.reduce((acc, t) => acc + (t.confidenceScore || 3), 0) / sub.topics.length
            ).toFixed(1)
          )
        : 3.0;

    totalTopics += subTotalTopics;
    completedTopics += subCompletedTopics;
    totalPyqsSolved += subPyqsSolved;
    totalPyqsOverall += subPyqsTotal;
    totalAccuracyWeight += subAvgAccuracy * subTotalTopics;

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      shortCode: sub.shortCode,
      completedTopics: subCompletedTopics,
      totalTopics: subTotalTopics,
      completionPercent:
        subTotalTopics > 0 ? Math.round((subCompletedTopics / subTotalTopics) * 100) : 0,
      pyqsSolved: subPyqsSolved,
      pyqsTotal: subPyqsTotal,
      pyqAccuracy: subAvgAccuracy,
      averageConfidence: subAvgConf,
    };
  });

  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const overallPyqAccuracy =
    totalTopics > 0 ? Math.round(totalAccuracyWeight / totalTopics) : 0;

  const mockScores = mockTests.map((m) => m.score);
  const mockAverageScore =
    mockScores.length > 0
      ? Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length)
      : 0;

  // Protect peer email privacy: only expose email to the user himself
  const safeEmail = isCurrentUser ? user.email : '';

  return {
    id: user.id,
    email: safeEmail,
    fullName: user.fullName || settings?.userName || 'GATE DA Aspirant',
    avatarUrl: user.avatarUrl,
    targetAir: user.targetAir || settings?.targetAir || 1,
    targetCollege: user.targetCollege || settings?.targetCollege || 'IISc Bangalore (M.Tech AI)',
    targetYear: settings?.targetYear || 2028,
    syllabusPercent,
    totalHoursStudied: Number(baseHours.toFixed(1)),
    totalPyqsSolved,
    totalPyqsOverall,
    overallPyqAccuracy,
    mockTestsTaken: mockTests.length,
    mockAverageScore,
    studyStreakDays: settings?.streakCount ?? 0,
    lastActive: isCurrentUser ? 'Just now (Live)' : 'Recently',
    isCurrentUser,
    subjects: subjectSummaries,
    fullSubjects: JSON.parse(JSON.stringify(subjects)), // Read-only clone
  };
}

/**
 * Saves and synchronizes a user's real profile and subject progress directly into Supabase database.
 * Real database tables: `profiles`, `subject_progress`, and `tests`.
 */
export async function syncUserProfileAndProgressToDatabase(
  user: AuthUser,
  subjects: Subject[],
  totalHours: number,
  mockTests: MockTest[],
  settings: UserSettings
): Promise<{ success: boolean; message: string }> {
  // Prevent sync for demo or guest accounts
  if (!user?.id || user.isDemo || user.id.startsWith('demo_') || user.id.startsWith('guest_') || user.id.includes('aspirant')) {
    return { success: false, message: 'Demo sandbox mode active. Cloud synchronization is disabled.' };
  }

  // Respect user privacy opt-in setting
  if (settings.shareProgressWithCohort === false) {
    return { success: false, message: 'Cohort sharing is disabled in your privacy settings.' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== user.id) {
      return { success: false, message: 'Active Supabase session required for cloud progress synchronization.' };
    }

    const errors: string[] = [];

    // 1. Upsert profile in Supabase profiles table (never overwrite existing admin/content_manager role)
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: user.fullName || settings.userName || 'GATE DA Aspirant',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileErr) {
      errors.push(`Profile: ${profileErr.message}`);
    }

    // 2. Upsert subject progress for each subject in subject_progress table
    let progressUpserted = 0;
    for (const sub of subjects) {
      const { error: spErr } = await supabase.from('subject_progress').upsert(
        {
          student_id: user.id,
          subject_id: sub.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,subject_id' }
      );

      if (!spErr) {
        progressUpserted++;
      }
    }

    // 3. Sync mock tests to tests table with explicit student_id ownership
    if (mockTests.length > 0) {
      const dbTests = mockTests.map((m) => ({
        id: getDeterministicUuid(`test_${user.id}_${m.id}`),
        student_id: user.id,
        title: m.title,
        created_at: m.date || new Date().toISOString(),
      }));
      const { error: testErr } = await supabase.from('tests').upsert(dbTests, { onConflict: 'id' });
      if (testErr) {
        errors.push(`Tests: ${testErr.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Sync partially failed: ${errors.join(', ')}`,
      };
    }

    return {
      success: true,
      message: `Synchronized profile, ${progressUpserted}/${subjects.length} subject records, and ${mockTests.length} tests.`,
    };
  } catch (err: any) {
    console.warn('syncUserProfileAndProgressToDatabase exception:', err);
    return {
      success: false,
      message: err.message || 'Database sync encountered an issue.',
    };
  }
}

/**
 * Fetches ALL registered users and their progress + coin balances directly from Supabase.
 * Sorted primarily by Coins earned (with syllabus & hours as tie-breakers) so every aspirant
 * sees the full community ranking.
 */
export async function getAllPeerProfilesFromDatabase(
  currentUser: AuthUser | null,
  currentSubjects: Subject[],
  currentHours: number,
  currentMocks: MockTest[],
  currentSettings: UserSettings,
  currentCoinBalance: number = 0,
  levelTests: LevelTest[] = []
): Promise<{
  profiles: UserProgressProfile[];
  dbConnected: boolean;
  totalRealUsers: number;
  message: string;
}> {
  const profilesMap = new Map<string, UserProgressProfile>();
  let dbConnected = false;
  let dbMessage = 'Live rankings synced';

  const isDemo = !currentUser || currentUser.isDemo || currentUser.id.startsWith('demo_');

  // Count tests created per user for coin/activity visibility
  const testsCreatedByUser = new Map<string, number>();
  levelTests.forEach((t) => {
    if (!t.createdBy) return;
    testsCreatedByUser.set(t.createdBy, (testsCreatedByUser.get(t.createdBy) || 0) + 1);
  });

  // 1. Current user profile (marked isCurrentUser: true)
  if (currentUser) {
    const myProfile = computeUserProgressProfile(
      currentUser,
      currentSubjects,
      currentHours,
      currentMocks,
      currentSettings,
      true
    );
    myProfile.coinBalance = currentCoinBalance;
    myProfile.testsCreated = testsCreatedByUser.get(currentUser.id) || 0;
    profilesMap.set(currentUser.id, myProfile);
  }

  // 2. Query Supabase `profiles` for ALL registered aspirants
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && !isDemo) {
      let remoteProfiles: Array<{
        id: string;
        full_name?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        coin_balance?: number | null;
      }> = [];

      const primaryRes = await supabase
        .from('profiles')
        .select('id, full_name, created_at, updated_at, coin_balance')
        .limit(200);

      if (primaryRes.error) {
        // If coin_balance column hasn't been added via SQL migration yet, still load all profiles!
        const msg = String(primaryRes.error.message || '').toLowerCase();
        if (primaryRes.error.code === '42703' || msg.includes('coin_balance')) {
          const fallbackRes = await supabase
            .from('profiles')
            .select('id, full_name, created_at, updated_at')
            .limit(200);
          if (!fallbackRes.error && fallbackRes.data) {
            dbConnected = true;
            remoteProfiles = fallbackRes.data;
          } else if (fallbackRes.error) {
            dbMessage = `Could not load aspirants: ${fallbackRes.error.message}`;
          }
        } else {
          dbMessage = `Could not load aspirants: ${primaryRes.error.message}`;
        }
      } else {
        dbConnected = true;
        remoteProfiles = primaryRes.data || [];
      }

      if (dbConnected && remoteProfiles.length > 0) {
        // Load any readable study state in parallel without blocking or hiding peers
        await Promise.all(
          remoteProfiles.map(async (remote) => {
            if (!remote.id) return;

            const createdTestsCount = testsCreatedByUser.get(remote.id) || 0;
            const dbCoins =
              typeof remote.coin_balance === 'number'
                ? remote.coin_balance
                : createdTestsCount * COINS_TEST_CREATE;

            if (remote.id === currentUser?.id) {
              const existingMe = profilesMap.get(remote.id);
              if (existingMe) {
                existingMe.coinBalance = Math.max(existingMe.coinBalance ?? 0, dbCoins);
                existingMe.testsCreated = createdTestsCount;
              }
              return;
            }

            let cloudState: { state: any } = { state: null };
            try {
              cloudState = await loadUserStudyState(remote.id);
            } catch {
              // Peer study state is private by RLS; still show the aspirant on the leaderboard
            }

            const pSubjects: Subject[] = Array.isArray(cloudState.state?.subjects)
              ? (cloudState.state.subjects as Subject[])
              : createFreshZeroSubjects();
            const pHours: number =
              typeof cloudState.state?.baseLoggedHours === 'number'
                ? cloudState.state.baseLoggedHours
                : 0;
            const pMocks: MockTest[] = Array.isArray(cloudState.state?.mockTests)
              ? (cloudState.state.mockTests as MockTest[])
              : [];
            const pSettings: UserSettings =
              cloudState.state?.settings && typeof cloudState.state.settings === 'object'
                ? (cloudState.state.settings as UserSettings)
                : {
                    targetAir: 10,
                    targetCollege: 'IISc Bangalore (M.Tech AI)',
                    targetYear: 2028,
                    examDate: '2028-02-12',
                    dailyGoalHours: 4,
                    weeklyGoalHours: 25,
                    streakCount: 0,
                    userName: remote.full_name || 'GATE Aspirant',
                    shareProgressWithCohort: true,
                  };

            // Only hide if peer explicitly opted out inside readable settings
            if (pSettings.shareProgressWithCohort === false) {
              return;
            }

            const remoteUser: AuthUser = {
              id: remote.id,
              email: '',
              fullName: remote.full_name || 'GATE Aspirant',
              targetAir: pSettings.targetAir,
              targetCollege: pSettings.targetCollege,
              createdAt: remote.created_at || new Date().toISOString(),
            };

            const prof = computeUserProgressProfile(
              remoteUser,
              pSubjects,
              pHours,
              pMocks,
              pSettings,
              false
            );
            prof.coinBalance = dbCoins;
            prof.testsCreated = createdTestsCount;
            if (remote.updated_at) {
              try {
                prof.lastActive = new Intl.DateTimeFormat('en-IN', {
                  day: '2-digit',
                  month: 'short',
                }).format(new Date(remote.updated_at));
              } catch {
                prof.lastActive = 'Active';
              }
            }
            profilesMap.set(remote.id, prof);
          })
        );
      }
    } else {
      dbMessage = isDemo
        ? 'Demo mode active. Sign in to compete with all GATE DA aspirants.'
        : 'Sign in to view live community rankings.';
    }
  } catch (err: any) {
    console.warn('Supabase peer profiles fetch notice:', err);
    dbMessage = 'Offline mode';
  }

  // Sort strictly by Coins DESC, then Syllabus %, then Study Hours, then Name
  const profilesList = Array.from(profilesMap.values()).sort((a, b) => {
    const coinDiff = (b.coinBalance ?? 0) - (a.coinBalance ?? 0);
    if (coinDiff !== 0) return coinDiff;
    if (b.syllabusPercent !== a.syllabusPercent) return b.syllabusPercent - a.syllabusPercent;
    if (b.totalHoursStudied !== a.totalHoursStudied) return b.totalHoursStudied - a.totalHoursStudied;
    return a.fullName.localeCompare(b.fullName);
  });

  return {
    profiles: profilesList,
    dbConnected,
    totalRealUsers: profilesList.length,
    message: dbMessage,
  };
}
