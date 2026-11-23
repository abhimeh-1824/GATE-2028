import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Subject,
  Topic,
  Task,
  TaskStatus,
  SprintPlan,
  SprintRetrospective,
  MockTest,
  Milestone,
  CalendarEvent,
  UserSettings,
  TopicStatus,
  SubjectId,
  AuthUser,
  UserRole,
  SubtopicItem,
  StudyNote,
  LevelTest,
  TestAttempt,
  NoteEntityType,
  NoteType,
  CorrectOptionKey,
  LinkedAppletConfig,
  AppletSyncPayload,
  CoinTransaction,
  CoinAwardBreakdown,
  LeaderboardEntry,
  StudyStreakInfo,
} from '../types';
import {
  INITIAL_SPRINTS,
  INITIAL_MILESTONES,
  INITIAL_SETTINGS,
  createFreshZeroSubjects,
} from '../data/gateDaSyllabus';
import { soundManager } from '../utils/audio';
import { computeStudyStreak, getTodayLocalDateKey } from '../utils/streak';
import { supabase } from '../lib/supabase';
import { ensureChatGroupMembership as joinStudyGroup } from '../lib/chatService';
import {
  signUpUser,
  signInUser,
  signOutUser,
  getSavedAccounts,
  saveAccountLocally,
  getActiveUserId,
  setActiveUserId,
  syncTaskToSupabase,
  deleteTaskFromSupabase,
  loadTasksFromSupabase,
  fetchSyllabusFromDatabase,
  saveSyllabusToDatabase,
  fetchUserRole,
  fetchUserBlockStatus,
  updateSubjectInDb,
  deleteSubjectInDb,
  updateTopicInDb,
  deleteTopicInDb,
  reorderTopicsInDb,
  updateSubtopicInDb,
  deleteSubtopicInDb,
  reorderSubtopicsInDb,
} from '../lib/supabaseService';
import {
  fetchAllStudyNotes,
  syncLocalStudyNotesToCloud,
  fetchAllLevelTests,
  fetchTestAttempts,
  upsertStudyNote,
  deleteStudyNote,
  createLevelTest,
  updateLevelTest,
  deleteLevelTest,
  submitTestAttempt,
} from '../lib/notesTestsService';
import {
  COINS_TEST_CREATE,
  calculateAttemptCoinReward,
  fetchCoinState,
  awardCoins,
  fetchCoinLeaderboard,
} from '../lib/coinService';
import {
  loadUserStudyState,
  saveUserStudyState,
  migrateLegacyLocalStateToCloud,
} from '../lib/userStudyStateService';
import {
  getLinkedAppletConfig,
  saveLinkedAppletConfig,
  buildSyncPayload,
  pushSyncToLinkedApplet,
  pullSyncFromLinkedApplet,
  mergeRemotePayloadIntoLocal,
  subscribeToLinkedAppletBroadcast,
  DEFAULT_LINKED_APPLET_ID,
  DEFAULT_LINKED_PROJECT_ID,
  DEFAULT_LINKED_APPLET_URL,
} from '../lib/linkedAppletSyncService';

interface StudyContextType {
  // Auth & Multiple Users
  currentUser: AuthUser | null;
  allUsers: AuthUser[];
  isDemo: boolean;
  authLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  blockedAccountNotice: string | null;
  dismissBlockedAccountNotice: () => void;
  chatGroupJoinError: string | null;
  ensureChatGroupMembership: () => Promise<void>;
  login: (email: string, pass: string) => Promise<{
    success: boolean;
    error?: string;
    needsEmailConfirmation?: boolean;
    pendingAdminApproval?: boolean;
  }>;
  register: (
    email: string,
    pass: string,
    fullName: string,
    targetAir?: number,
    targetCollege?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    needsEmailConfirmation?: boolean;
    pendingAdminApproval?: boolean;
    approvalMessage?: string;
  }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  loginAsDemo: () => void;

  // Supabase Database Sync
  isDbConnected: boolean;
  isSyncingDb: boolean;
  dbSyncMessage: string;
  dbStats: { subjectsCount: number; topicsCount: number; subtopicsCount: number };
  syncSyllabusToDb: () => Promise<void>;
  fetchSyllabusFromDb: () => Promise<void>;

  // Linked AI Studio Applet Sync (Target: 2a25406d-a516-461a-aab7-208d3865f39c)
  linkedAppletConfig: LinkedAppletConfig;
  isSyncingLinkedApplet: boolean;
  linkedSyncMessage: string | null;
  syncWithLinkedApplet: (direction?: 'push' | 'pull' | 'bidirectional') => Promise<{ success: boolean; message: string }>;
  updateLinkedAppletConfig: (updates: Partial<LinkedAppletConfig>) => void;
  toggleLinkedAutoSync: () => void;
  isLinkedSyncModalOpen: boolean;
  setIsLinkedSyncModalOpen: (open: boolean) => void;

  // Study Data
  subjects: Subject[];
  tasks: Task[];
  sprints: SprintPlan[];
  selectedSprintWeek: string;
  setSelectedSprintWeek: (week: string) => void;
  mockTests: MockTest[];
  milestones: Milestone[];
  calendarEvents: CalendarEvent[];
  settings: UserSettings;
  activeView: string;
  setActiveView: (view: string) => void;

  // Stats
  totalTopics: number;
  completedTopics: number;
  syllabusPercent: number;
  totalHoursStudied: number;
  totalPyqsSolved: number;
  totalPyqsOverall: number;
  overallPyqAccuracy: number;
  daysRemaining: number;
  revisionDueCount: number;
  streakInfo: StudyStreakInfo;

  // Actions
  toggleTaskCompletion: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  assignTaskToSprint: (taskId: string, sprintId: string | null, sprintWeek?: string) => void;
  bulkAssignTasksToSprint: (taskIds: string[], sprintId: string | null, sprintWeek?: string) => void;
  createSprint: (sprint: Omit<SprintPlan, 'id' | 'createdAt'>) => void;
  updateSprint: (sprintId: string, updates: Partial<SprintPlan>) => void;
  completeSprint: (sprintId: string, retro: SprintRetrospective) => void;
  deleteSprint: (sprintId: string) => void;
  addSubject: (name: string, shortCode: string) => Promise<string>;
  updateSubject: (subjectId: SubjectId, name: string, shortCode: string) => Promise<void>;
  deleteSubject: (subjectId: SubjectId) => Promise<void>;
  addTopic: (subjectId: SubjectId, title: string) => Promise<void>;
  updateTopic: (subjectId: SubjectId, topicId: string, title: string) => Promise<void>;
  deleteTopic: (subjectId: SubjectId, topicId: string) => Promise<void>;
  reorderTopics: (subjectId: SubjectId, fromIndex: number, toIndex: number) => Promise<void>;
  addSubtopic: (subjectId: SubjectId, topicId: string, name: string) => Promise<void>;
  updateSubtopic: (subjectId: SubjectId, topicId: string, subtopicIndex: number, name: string) => Promise<void>;
  deleteSubtopic: (subjectId: SubjectId, topicId: string, subtopicIndex: number) => Promise<void>;
  reorderSubtopics: (subjectId: SubjectId, topicId: string, fromIndex: number, toIndex: number) => Promise<void>;
  updateTopicStatus: (subjectId: SubjectId, topicId: string, status: TopicStatus) => void;
  updateTopicConfidence: (subjectId: SubjectId, topicId: string, confidence: number) => void;

  // Role-Based Access & Hierarchical Notes / Tests
  userRole: UserRole;
  isAdmin: boolean;
  canManageContent: boolean;
  studyNotes: StudyNote[];
  levelTests: LevelTest[];
  testAttempts: TestAttempt[];
  notesTestsLoading: boolean;
  notesTestsNotice: string | null;
  refreshNotesAndTests: () => Promise<void>;
  saveStudyNote: (input: {
    entityType: NoteEntityType;
    entityId: string;
    subjectId: string;
    topicId?: string | null;
    subtopicId?: string | null;
    noteType: NoteType;
    title: string;
    rawHtml: string;
  }) => Promise<{ success: boolean; note?: StudyNote; error?: string }>;
  removeStudyNote: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  addLevelTest: (input: {
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
  }) => Promise<{ success: boolean; test?: LevelTest; coinsAwarded?: CoinAwardBreakdown; error?: string }>;
  editLevelTest: (
    testId: string,
    patch: Partial<Pick<LevelTest, 'title' | 'description' | 'durationMinutes' | 'passingPercentage' | 'isActive'>>
  ) => Promise<{ success: boolean; test?: LevelTest; error?: string }>;
  removeLevelTest: (testId: string) => Promise<{ success: boolean; error?: string }>;
  recordTestAttempt: (input: {
    testId: string;
    answers: Record<string, CorrectOptionKey>;
    score: number;
    totalQuestions: number;
    timeTakenSeconds: number;
  }) => Promise<{ success: boolean; attempt?: TestAttempt; coinsAwarded?: CoinAwardBreakdown; error?: string }>;

  // Coin Economy & Competitive Leaderboard
  coinBalance: number;
  coinTransactions: CoinTransaction[];
  leaderboard: LeaderboardEntry[];
  coinsLoading: boolean;
  lastCoinToast: { amount: number; reason: string } | null;
  dismissCoinToast: () => void;
  refreshCoinsAndLeaderboard: () => Promise<void>;
  addMockTest: (mock: Omit<MockTest, 'id'>) => void;
  updateMockTest: (mockId: string, updates: Partial<MockTest>) => void;
  deleteMockTest: (mockId: string) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (eventId: string) => void;
  toggleCalendarEventCompletion: (eventId: string) => void;
  addStudySessionHours: (minutes: number, subjectId?: SubjectId, topicTitle?: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Active Timer state
  timerState: {
    isRunning: boolean;
    timeLeft: number;
    initialTime: number;
    mode: 'focus' | 'short_break' | 'long_break';
    subjectId: SubjectId;
    topicTitle: string;
  };
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerMode: (mode: 'focus' | 'short_break' | 'long_break') => void;
  setTimerSubject: (subjectId: SubjectId, topicTitle: string) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const USER_DATA_PREFIX = 'gateda_2028_user_';

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Accounts and Current User State
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => getSavedAccounts());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);

  // Request generation token and abort controller to prevent race conditions during rapid switching
  const switchGenerationRef = React.useRef<number>(0);
  const switchAbortRef = React.useRef<AbortController | null>(null);
  const isRegisteringRef = React.useRef(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [chatGroupJoinError, setChatGroupJoinError] = useState<string | null>(null);

  const ensureChatGroupMembership = useCallback(async () => {
    if (!currentUser || isDemo || currentUser.id.startsWith('demo_')) {
      const error = new Error('Sign in with a permanent account to join the study group.');
      setChatGroupJoinError(error.message);
      throw error;
    }

    try {
      await joinStudyGroup();
      setChatGroupJoinError(null);
    } catch (error) {
      setChatGroupJoinError(error instanceof Error ? error.message : 'Could not join the study group.');
      throw error;
    }
  }, [currentUser, isDemo]);

  // Demo state is memory-only. Real users load and save through Supabase.
  const loadInitialData = (user: AuthUser | null, isDemoMode: boolean = false) => {
    if (isDemoMode || user?.isDemo || user?.id?.startsWith('demo_')) {
      return {
        subjects: createFreshZeroSubjects(),
        tasks: [],
        sprints: INITIAL_SPRINTS,
        mockTests: [],
        milestones: INITIAL_MILESTONES,
        calendarEvents: [],
        baseLoggedHours: 0,
        settings: {
          ...INITIAL_SETTINGS,
          userName: 'Demo Aspirant',
          targetAir: 1,
          targetCollege: 'IISc Bangalore (M.Tech AI)',
          shareProgressWithCohort: false,
        },
      };
    }

    return {
      subjects: createFreshZeroSubjects(),
      tasks: [],
      sprints: INITIAL_SPRINTS,
      mockTests: [],
      milestones: INITIAL_MILESTONES,
      calendarEvents: [],
      baseLoggedHours: 0,
      settings: {
        targetAir: user?.targetAir || 1,
        targetYear: 2028,
        examDate: '2028-02-13',
        dailyGoalHours: 4.5,
        weeklyGoalHours: 28,
        streakCount: 0,
        activeStudyDates: [],
        userName: user?.fullName || 'Aspirant',
        targetCollege: user?.targetCollege || 'IISc Bangalore (M.Tech AI)',
        shareProgressWithCohort: false,
      },
    };
  };

  const initialData = loadInitialData(null);

  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [sprints, setSprints] = useState<SprintPlan[]>(initialData.sprints || INITIAL_SPRINTS);
  const [selectedSprintWeek, setSelectedSprintWeek] = useState<string>('all');
  const [mockTests, setMockTests] = useState<MockTest[]>(initialData.mockTests);
  const [milestones, setMilestones] = useState<Milestone[]>(initialData.milestones);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialData.calendarEvents);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  const [baseLoggedHours, setBaseLoggedHours] = useState<number>(initialData.baseLoggedHours);
  const [cloudStateLoaded, setCloudStateLoaded] = useState(false);

  // Supabase Database Syllabus Sync
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbSyncMessage, setDbSyncMessage] = useState<string>('Sign in to load your syllabus from Supabase.');
  const [dbStats, setDbStats] = useState<{ subjectsCount: number; topicsCount: number; subtopicsCount: number }>({
    subjectsCount: initialData.subjects.length,
    topicsCount: initialData.subjects.reduce((acc: number, s: Subject) => acc + s.topics.length, 0),
    subtopicsCount: initialData.subjects.reduce(
      (acc: number, s: Subject) => acc + s.topics.reduce((tAcc: number, t: Topic) => tAcc + (t.subtopics?.length || 0), 0),
      0
    ),
  });

  // Linked AI Studio Applet Sync state (Target Applet: 2a25406d-a516-461a-aab7-208d3865f39c)
  const [linkedAppletConfig, setLinkedAppletConfig] = useState<LinkedAppletConfig>(getLinkedAppletConfig);
  const [isSyncingLinkedApplet, setIsSyncingLinkedApplet] = useState<boolean>(false);
  const [linkedSyncMessage, setLinkedSyncMessage] = useState<string | null>(null);
  const [isLinkedSyncModalOpen, setIsLinkedSyncModalOpen] = useState<boolean>(false);

  const updateLinkedAppletConfig = useCallback((updates: Partial<LinkedAppletConfig>) => {
    setLinkedAppletConfig((prev) => {
      const updated = { ...prev, ...updates };
      saveLinkedAppletConfig(updated);
      return updated;
    });
  }, []);

  const toggleLinkedAutoSync = useCallback(() => {
    setLinkedAppletConfig((prev) => {
      const updated = { ...prev, autoSync: !prev.autoSync };
      saveLinkedAppletConfig(updated);
      return updated;
    });
  }, []);

  const fetchSyllabusFromDb = useCallback(async () => {
    if (!currentUser || isDemo || currentUser.id.startsWith('demo_') || currentUser.id.startsWith('guest_')) {
      setSubjects([]);
      setDbStats({ subjectsCount: 0, topicsCount: 0, subtopicsCount: 0 });
      setDbSyncMessage('Sign in to load your syllabus from Supabase.');
      return;
    }

    const ownerId = currentUser.id;
    setIsSyncingDb(true);
    try {
      const result = await fetchSyllabusFromDatabase(ownerId);
      if (getActiveUserId() !== ownerId) return;
      setIsDbConnected(true);
      setDbStats(result.stats);
      setDbSyncMessage(result.message);
      setSubjects(result.subjects);
    } catch (error) {
      setIsDbConnected(false);
      const message = error instanceof Error ? error.message : 'Could not load your syllabus.';
      console.warn('fetchSyllabusFromDb err:', error);
      setDbSyncMessage(message);
    } finally {
      setIsSyncingDb(false);
    }
  }, [currentUser?.id, isDemo]);

  // Save the current user's frontend-created syllabus to Supabase.
  const syncSyllabusToDb = useCallback(async () => {
    setIsSyncingDb(true);
    try {
      if (!currentUser || isDemo || currentUser.id.startsWith('demo_') || currentUser.id.startsWith('guest_')) {
        throw new Error('Sign in to save your syllabus to Supabase.');
      }

      const result = await saveSyllabusToDatabase(subjects, currentUser.id);
      setDbSyncMessage(result.message);
      setDbStats({
        subjectsCount: result.subjectsSaved,
        topicsCount: result.topicsSaved,
        subtopicsCount: result.subtopicsSaved,
      });
      if (!result.success) throw new Error(result.error || result.message);
      setIsDbConnected(true);
      soundManager.playCompletionChime();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your syllabus.';
      console.warn('syncSyllabusToDb err:', error);
      setIsDbConnected(false);
      setDbSyncMessage(message);
    } finally {
      setIsSyncingDb(false);
    }
  }, [currentUser?.id, isDemo, subjects]);

  // Supabase Auth Session Initialization & Lifecycle Listener on Mount
  useEffect(() => {
    let isMounted = true;

    // Verify active Supabase session (Never trust localStorage identity alone)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (session?.user && !error) {
        const sbUser = session.user;
        const verifiedUser: AuthUser = {
          id: sbUser.id,
          email: sbUser.email || '',
          fullName: sbUser.user_metadata?.full_name || 'Aspirant',
          targetAir: Number(sbUser.user_metadata?.target_air) || 1,
          targetCollege: sbUser.user_metadata?.target_college || 'IISc Bangalore (M.Tech AI)',
          createdAt: sbUser.created_at || new Date().toISOString(),
          isConfirmed: true,
          isDemo: false,
        };

        saveAccountLocally(verifiedUser);
        setActiveUserId(verifiedUser.id);
        setCurrentUser(verifiedUser);
        setIsDemo(false);
        setAllUsers(getSavedAccounts());

        // Load data for verified user from database state
        void (async () => {
          await migrateLegacyLocalStateToCloud(verifiedUser.id);
          const { state, error } = await loadUserStudyState(verifiedUser.id);
          if (!isMounted) return;
          if (error) console.warn('Could not load cloud user study state:', error);
          if (state) {
            if (Array.isArray(state.subjects)) setSubjects(state.subjects as Subject[]);
            if (Array.isArray(state.tasks)) setTasks(state.tasks as Task[]);
            if (Array.isArray(state.sprints)) setSprints(state.sprints as SprintPlan[]);
            if (Array.isArray(state.mockTests)) setMockTests(state.mockTests as MockTest[]);
            if (Array.isArray(state.milestones)) setMilestones(state.milestones as Milestone[]);
            if (Array.isArray(state.calendarEvents)) setCalendarEvents(state.calendarEvents as CalendarEvent[]);
            if (state.settings && typeof state.settings === 'object') setSettings(state.settings as UserSettings);
            if (typeof state.baseLoggedHours === 'number') setBaseLoggedHours(state.baseLoggedHours);
          }
          setCloudStateLoaded(true);
        })();

        const userData = loadInitialData(verifiedUser, false);
        setSubjects((prev) => prev.length > 0 ? prev : userData.subjects);
        setTasks((prev) => prev.length > 0 ? prev : userData.tasks);
        setSprints(userData.sprints || INITIAL_SPRINTS);
        setMockTests(userData.mockTests);
        setMilestones(userData.milestones);
        setCalendarEvents(userData.calendarEvents);
        setSettings(userData.settings);
        setBaseLoggedHours(userData.baseLoggedHours);

        // Fetch tasks from Supabase
        loadTasksFromSupabase(verifiedUser.id).then((remoteTasks) => {
          if (!isMounted) return;
          if (remoteTasks.length > 0) {
            setTasks((prev) => {
              const merged = [...prev];
              for (const rt of remoteTasks) {
                if (!merged.some((m) => m.id === rt.id)) {
                  merged.push(rt);
                }
              }
              return merged;
            });
          }
        });
      } else {
        // No active session: clean visitor state
        setActiveUserId(null);
        setCurrentUser(null);
        setIsDemo(false);
      }
      setAuthLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      console.warn('Session verification notice:', err);
      setActiveUserId(null);
      setCurrentUser(null);
      setIsDemo(false);
      setAuthLoading(false);
    });

    // Handle all Supabase auth lifecycle events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (isRegisteringRef.current && event !== 'SIGNED_OUT') return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          const sbUser = session.user;
          const verifiedUser: AuthUser = {
            id: sbUser.id,
            email: sbUser.email || '',
            fullName: sbUser.user_metadata?.full_name || 'Aspirant',
            targetAir: Number(sbUser.user_metadata?.target_air) || 1,
            targetCollege: sbUser.user_metadata?.target_college || 'IISc Bangalore (M.Tech AI)',
            createdAt: sbUser.created_at || new Date().toISOString(),
            isConfirmed: true,
            isDemo: false,
          };
          saveAccountLocally(verifiedUser);
          setActiveUserId(verifiedUser.id);
          setCurrentUser((prev) =>
            prev &&
            prev.id === verifiedUser.id &&
            prev.email === verifiedUser.email &&
            prev.fullName === verifiedUser.fullName &&
            prev.isDemo === false
              ? prev
              : verifiedUser
          );
          setIsDemo(false);
          setAllUsers(getSavedAccounts());
        }
      } else if (event === 'SIGNED_OUT') {
        setActiveUserId(null);
        setCurrentUser(null);
        setIsDemo(false);
        setSubjects([]);
        setTasks([]);
        setSprints(INITIAL_SPRINTS);
        setMockTests([]);
        setCalendarEvents([]);
        setBaseLoggedHours(0);
        setSettings(INITIAL_SETTINGS);
        setIsDbConnected(false);
        setDbStats({ subjectsCount: 0, topicsCount: 0, subtopicsCount: 0 });
        setDbSyncMessage('Sign in to load your syllabus from Supabase.');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser || isDemo || currentUser.id.startsWith('demo_')) {
      setChatGroupJoinError(null);
      return;
    }

    let active = true;
    void ensureChatGroupMembership().catch((error: unknown) => {
      if (active) console.warn('Automatic study group join failed:', error);
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id, isDemo, ensureChatGroupMembership]);

  useEffect(() => {
    if (!currentUser || isDemo) {
      setSubjects([]);
      setDbStats({ subjectsCount: 0, topicsCount: 0, subtopicsCount: 0 });
      setDbSyncMessage('Sign in to load your syllabus from Supabase.');
      return;
    }
    void fetchSyllabusFromDb();
  }, [currentUser?.id, isDemo, fetchSyllabusFromDb]);

  const [activeView, setActiveView] = useState<string>('Dashboard');

  // Pomodoro Timer
  const [timerState, setTimerState] = useState<{
    isRunning: boolean;
    timeLeft: number;
    initialTime: number;
    mode: 'focus' | 'short_break' | 'long_break';
    subjectId: SubjectId;
    topicTitle: string;
  }>({
    isRunning: false,
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    mode: 'focus',
    subjectId: '',
    topicTitle: '',
  });

  // Switch user handler with request generation tokens and cancellation
  const switchUser = useCallback(async (userId: string) => {
    const saved = getSavedAccounts();
    const target = saved.find((u) => u.id === userId);
    if (!target) return;

    // Increment request generation and abort any pending task fetches from previous accounts
    const currentGen = ++switchGenerationRef.current;
    if (switchAbortRef.current) {
      switchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    switchAbortRef.current = abortController;

    // Suspend persistence during atomic state replacement
    setIsSwitchingUser(true);
    setActiveUserId(target.id);
    setCurrentUser(target);
    const targetIsDemo = target.isDemo || target.id.startsWith('demo_');
    setIsDemo(targetIsDemo);

    // Load new user's data atomically
    const data = loadInitialData(target, targetIsDemo);
    setSubjects(data.subjects);
    setTasks(data.tasks);
    setSprints(data.sprints || INITIAL_SPRINTS);
    setMockTests(data.mockTests);
    setMilestones(data.milestones);
    setCalendarEvents(data.calendarEvents);
    setSettings(data.settings);
    setBaseLoggedHours(data.baseLoggedHours);

    if (!targetIsDemo) {
      void (async () => {
        await migrateLegacyLocalStateToCloud(target.id);
        const { state, error } = await loadUserStudyState(target.id);
        if (error) console.warn("Could not load switched user's cloud state:", error);
        if (state) {
          if (Array.isArray(state.subjects)) setSubjects(state.subjects as Subject[]);
          if (Array.isArray(state.tasks)) setTasks(state.tasks as Task[]);
          if (Array.isArray(state.sprints)) setSprints(state.sprints as SprintPlan[]);
          if (Array.isArray(state.mockTests)) setMockTests(state.mockTests as MockTest[]);
          if (Array.isArray(state.milestones)) setMilestones(state.milestones as Milestone[]);
          if (Array.isArray(state.calendarEvents)) setCalendarEvents(state.calendarEvents as CalendarEvent[]);
          if (state.settings && typeof state.settings === 'object') setSettings(state.settings as UserSettings);
          if (typeof state.baseLoggedHours === 'number') setBaseLoggedHours(state.baseLoggedHours);
        }
      })();
    }

    // Resume persistence after all state slices have settled
    setTimeout(() => {
      setIsSwitchingUser(false);
    }, 50);

    soundManager.playSubtleTick();

    // If real user (not demo), verify Supabase session matches before fetching remote tasks
    if (!targetIsDemo) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (
          !abortController.signal.aborted &&
          currentGen === switchGenerationRef.current &&
          session?.user?.id === target.id
        ) {
          const remoteTasks = await loadTasksFromSupabase(target.id);
          if (
            !abortController.signal.aborted &&
            currentGen === switchGenerationRef.current &&
            getActiveUserId() === target.id
          ) {
            if (remoteTasks.length > 0) {
              setTasks((prev) => {
                const merged = [...prev];
                for (const rt of remoteTasks) {
                  if (!merged.some((m) => m.id === rt.id)) {
                    merged.push(rt);
                  }
                }
                return merged;
              });
            }
          }
        }
      } catch (e) {
        console.warn('switchUser remote task load notice:', e);
      }
    }
  }, []);

  // Persist the complete real-user study state to Supabase (debounced to prevent burst writes on load).
  useEffect(() => {
    if (isSwitchingUser || authLoading || isDemo || !currentUser?.id || !cloudStateLoaded) return;

    const userId = currentUser.id;
    const timer = window.setTimeout(() => {
      void saveUserStudyState(userId, {
        subjects,
        tasks,
        sprints,
        mockTests,
        milestones,
        calendarEvents,
        settings,
        baseLoggedHours,
      }).catch((error) => {
        console.warn('Could not persist cloud user study state:', error);
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [
    subjects,
    tasks,
    sprints,
    mockTests,
    milestones,
    calendarEvents,
    settings,
    baseLoggedHours,
    currentUser?.id,
    isDemo,
    isSwitchingUser,
    authLoading,
    cloudStateLoaded,
  ]);

  // Auth Operations
  const login = async (email: string, pass: string) => {
    setBlockedAccountNotice(null);
    const res = await signInUser(email, pass);
    if (res.user) {
      setAllUsers(getSavedAccounts());
      await switchUser(res.user.id);
      return { success: true, needsEmailConfirmation: res.needsEmailConfirmation };
    }
    return {
      success: false,
      error: res.error || 'Authentication failed.',
      needsEmailConfirmation: res.needsEmailConfirmation,
      pendingAdminApproval: res.pendingAdminApproval,
    };
  };

  const register = async (
    email: string,
    pass: string,
    fullName: string,
    targetAir: number = 1,
    targetCollege: string = 'IISc Bangalore (M.Tech AI)'
  ) => {
    isRegisteringRef.current = true;
    try {
      const res = await signUpUser(email, pass, fullName, targetAir, targetCollege);
      if (res.pendingAdminApproval) {
        return {
          success: true,
          pendingAdminApproval: true,
          approvalMessage: res.approvalMessage,
        };
      }
      if (res.user) {
        setAllUsers(getSavedAccounts());
        return { success: true, needsEmailConfirmation: res.needsEmailConfirmation };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const logout = () => {
    signOutUser();
    setIsDemo(false);
    setCurrentUser(null);
    setActiveUserId(null);

    // Revert to clean guest state
    setSubjects([]);
    setTasks([]);
    setSprints(INITIAL_SPRINTS);
    setMockTests([]);
    setMilestones(INITIAL_MILESTONES);
    setCalendarEvents([]);
    setBaseLoggedHours(0);
    setSettings(INITIAL_SETTINGS);
    setIsDbConnected(false);
    setDbStats({ subjectsCount: 0, topicsCount: 0, subtopicsCount: 0 });
    setDbSyncMessage('Sign in to load your syllabus from Supabase.');
  };

  const loginAsDemo = useCallback(() => {
    setIsSwitchingUser(true);
    const demoUser: AuthUser = {
      id: 'demo_aspirant_gate_da_2028',
      email: 'demo.aspirant@gate-da.example.com',
      fullName: 'Demo Aspirant',
      targetAir: 1,
      targetCollege: 'IISc Bangalore (M.Tech AI)',
      createdAt: new Date().toISOString(),
      isConfirmed: true,
      isDemo: true,
    };

    setIsDemo(true);
    setCurrentUser(demoUser);

    const data = loadInitialData(demoUser, true);
    setSubjects(data.subjects);
    setTasks(data.tasks);
    setMockTests(data.mockTests);
    setMilestones(data.milestones);
    setCalendarEvents(data.calendarEvents);
    setSettings(data.settings);
    setBaseLoggedHours(data.baseLoggedHours);

    setTimeout(() => {
      setIsSwitchingUser(false);
    }, 50);

    soundManager.playCompletionChime();
  }, []);

  // Timer Tick - Stable interval without recreating every second
  useEffect(() => {
    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.timeLeft <= 1) {
          soundManager.playFocusAlert();
          if (prev.mode === 'focus') {
            const mins = Math.round(prev.initialTime / 60);
            addStudySessionHours(mins, prev.subjectId, prev.topicTitle);
          }
          return {
            ...prev,
            timeLeft: 0,
            isRunning: false,
          };
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timerState.isRunning]);

  // Calculated Metrics
  const allTopics = subjects.flatMap((s) => s.topics);
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter((t) => t.status === 'completed').length;
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const totalPyqsSolved = allTopics.reduce((acc, t) => acc + (t.pyqsSolved || 0), 0);
  const totalPyqsOverall = allTopics.reduce((acc, t) => acc + (t.pyqsTotal || 0), 0);
  const topicsWithPyqs = allTopics.filter((t) => t.pyqsSolved > 0);
  const overallPyqAccuracy =
    topicsWithPyqs.length > 0
      ? Math.round(topicsWithPyqs.reduce((acc, t) => acc + (t.pyqAccuracy || 0), 0) / topicsWithPyqs.length)
      : 0;

  const revisionDueCount = allTopics.filter((t) => t.status === 'revision_due').length;

  const completedTaskMins = tasks.filter((t) => t.completed).reduce((acc, t) => acc + t.durationMinutes, 0);
  const totalHoursStudied = Number((baseLoggedHours + completedTaskMins / 60).toFixed(1));

  const examDateObj = new Date(settings.examDate);
  const nowObj = new Date();
  const diffTime = examDateObj.getTime() - nowObj.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Record today's study activity date for Consistent Streak tracking
  const recordStudyActivityToday = useCallback(() => {
    const todayKey = getTodayLocalDateKey();
    setSettings((prev) => {
      const existing = Array.isArray(prev.activeStudyDates) ? prev.activeStudyDates : [];
      if (existing.includes(todayKey)) return prev;
      return {
        ...prev,
        activeStudyDates: [...existing, todayKey].slice(-365),
      };
    });
  }, []);

  // Actions
  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextState = !task.completed;
          const updated: Task = {
            ...task,
            completed: nextState,
            status: nextState ? 'done' : (task.status === 'done' ? 'todo' : task.status || 'todo'),
          };
          if (currentUser?.id) {
            syncTaskToSupabase(updated, currentUser.id);
          }
          if (nextState) {
            recordStudyActivityToday();
            soundManager.playCompletionChime();
          } else {
            soundManager.playSubtleTick();
          }
          return updated;
        }
        return task;
      })
    );
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const isCompleted = taskData.completed ?? false;
    const initialStatus = taskData.status || (isCompleted ? 'done' : 'todo');
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: initialStatus === 'done' ? true : isCompleted,
      status: initialStatus,
    };
    setTasks((prev) => [newTask, ...prev]);
    if (newTask.completed) {
      recordStudyActivityToday();
    }
    if (currentUser?.id) {
      syncTaskToSupabase(newTask, currentUser.id);
    }
    soundManager.playSubtleTick();
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = updates.status !== undefined ? updates.status === 'done' : (updates.completed ?? t.completed);
          const computedStatus = updates.status !== undefined
            ? updates.status
            : (updates.completed !== undefined ? (updates.completed ? 'done' : (t.status === 'done' ? 'todo' : t.status || 'todo')) : t.status);
          const updated: Task = {
            ...t,
            ...updates,
            completed: isDone,
            status: computedStatus,
          };
          if (currentUser?.id) {
            syncTaskToSupabase(updated, currentUser.id);
          }
          return updated;
        }
        return t;
      })
    );
    soundManager.playSubtleTick();
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (currentUser?.id) {
      deleteTaskFromSupabase(taskId, currentUser.id);
    }
    soundManager.playSubtleTick();
  };

  const moveTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = newStatus === 'done';
          const updated: Task = {
            ...t,
            status: newStatus,
            completed: isDone,
          };
          if (currentUser?.id) {
            syncTaskToSupabase(updated, currentUser.id);
          }
          if (isDone && !t.completed) {
            recordStudyActivityToday();
            soundManager.playCompletionChime();
          } else {
            soundManager.playSubtleTick();
          }
          return updated;
        }
        return t;
      })
    );
  };

  const assignTaskToSprint = (taskId: string, sprintId: string | null, sprintWeek?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated: Task = {
            ...t,
            sprintId: sprintId || undefined,
            sprintWeek: sprintWeek || undefined,
          };
          if (currentUser?.id) {
            syncTaskToSupabase(updated, currentUser.id);
          }
          return updated;
        }
        return t;
      })
    );
    soundManager.playSubtleTick();
  };

  const bulkAssignTasksToSprint = (taskIds: string[], sprintId: string | null, sprintWeek?: string) => {
    const idSet = new Set(taskIds);
    setTasks((prev) =>
      prev.map((t) => {
        if (idSet.has(t.id)) {
          const updated: Task = {
            ...t,
            sprintId: sprintId || undefined,
            sprintWeek: sprintWeek || undefined,
          };
          if (currentUser?.id) {
            syncTaskToSupabase(updated, currentUser.id);
          }
          return updated;
        }
        return t;
      })
    );
    soundManager.playSubtleTick();
  };

  const createSprint = (sprintData: Omit<SprintPlan, 'id' | 'createdAt'>) => {
    const newSprint: SprintPlan = {
      ...sprintData,
      id: `sprint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSprints((prev) => [newSprint, ...prev]);
    setSelectedSprintWeek(newSprint.weekIdentifier);
    soundManager.playCompletionChime();
  };

  const updateSprint = (sprintId: string, updates: Partial<SprintPlan>) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, ...updates } : s))
    );
    soundManager.playSubtleTick();
  };

  const completeSprint = (sprintId: string, retro: SprintRetrospective) => {
    setSprints((prev) =>
      prev.map((s) =>
        s.id === sprintId
          ? {
              ...s,
              status: 'completed',
              retrospective: retro,
            }
          : s
      )
    );
    soundManager.playCompletionChime();
  };

  const deleteSprint = (sprintId: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== sprintId));
    setTasks((prev) =>
      prev.map((t) => (t.sprintId === sprintId ? { ...t, sprintId: undefined, sprintWeek: undefined } : t))
    );
    soundManager.playSubtleTick();
  };

  const persistSyllabus = async (updatedSubjects: Subject[]) => {
    if (!currentUser || currentUser.id.startsWith('demo_') || currentUser.id.startsWith('guest_')) {
      setSubjects(updatedSubjects);
      soundManager.playSubtleTick();
      return;
    }

    const result = await saveSyllabusToDatabase(updatedSubjects, currentUser.id);
    if (!result.success) throw new Error(result.error || result.message);

    setSubjects(updatedSubjects);
    setDbStats({
      subjectsCount: result.subjectsSaved,
      topicsCount: result.topicsSaved,
      subtopicsCount: result.subtopicsSaved,
    });
    setDbSyncMessage(result.message);
    setIsDbConnected(true);
    soundManager.playSubtleTick();
  };

  const addSubject = async (name: string, shortCode: string): Promise<string> => {
    const cleanName = name.trim();
    const cleanCode = shortCode.trim().toUpperCase();
    if (!cleanName || !cleanCode) throw new Error('Subject name and code are required.');
    if (subjects.some((subject) => subject.shortCode.toLowerCase() === cleanCode.toLowerCase())) {
      throw new Error('A subject with this code already exists.');
    }

    const subject: Subject = {
      id: crypto.randomUUID(),
      name: cleanName,
      shortCode: cleanCode,
      weightageMarks: '',
      approxQuestions: 0,
      color: '#4f46e5',
      bgLight: '#eef2ff',
      borderColor: '#c7d2fe',
      description: '',
      recommendedBooks: [],
      topics: [],
    };

    await persistSyllabus([...subjects, subject]);
    return subject.id;
  };

  const updateSubject = async (subjectId: SubjectId, name: string, shortCode: string) => {
    const cleanName = name.trim();
    const cleanCode = shortCode.trim().toUpperCase();
    if (!cleanName || !cleanCode) throw new Error('Subject name and code are required.');

    if (currentUser && !isDemo) {
      const res = await updateSubjectInDb(subjectId, { name: cleanName, code: cleanCode });
      if (!res.success) throw new Error(res.error || 'Could not update subject.');
    }

    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, name: cleanName, shortCode: cleanCode } : s))
    );
    soundManager.playSubtleTick();
  };

  const deleteSubject = async (subjectId: SubjectId) => {
    if (currentUser && !isDemo) {
      const res = await deleteSubjectInDb(subjectId);
      if (!res.success) throw new Error(res.error || 'Could not delete subject.');
    }

    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setStudyNotes((prev) => prev.filter((n) => n.subjectId !== subjectId));
    setLevelTests((prev) => prev.filter((t) => t.subjectId !== subjectId));
    soundManager.playSubtleTick();
  };

  const addTopic = async (subjectId: SubjectId, title: string) => {
    const cleanTitle = title.trim();
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) throw new Error('Select a subject before adding a topic.');
    if (!cleanTitle) throw new Error('Topic name is required.');
    if (subject.topics.some((topic) => topic.title.toLowerCase() === cleanTitle.toLowerCase())) {
      throw new Error('This topic already exists in the selected subject.');
    }

    const topic: Topic = {
      id: crypto.randomUUID(),
      subjectId,
      title: cleanTitle,
      subtopics: [],
      subtopicItems: [],
      weightageTier: 'Foundational',
      status: 'unvisited',
      confidenceScore: 3,
      pyqsTotal: 0,
      pyqsSolved: 0,
      pyqAccuracy: 0,
      formulas: [],
      commonTraps: [],
    };

    await persistSyllabus(subjects.map((item) => (
      item.id === subjectId ? { ...item, topics: [...item.topics, topic] } : item
    )));
  };

  const updateTopic = async (subjectId: SubjectId, topicId: string, title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) throw new Error('Topic name is required.');

    if (currentUser && !isDemo) {
      const res = await updateTopicInDb(topicId, { name: cleanTitle });
      if (!res.success) throw new Error(res.error || 'Could not update topic.');
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.map((t) => (t.id === topicId ? { ...t, title: cleanTitle } : t)) }
          : s
      )
    );
    soundManager.playSubtleTick();
  };

  const deleteTopic = async (subjectId: SubjectId, topicId: string) => {
    if (currentUser && !isDemo) {
      const res = await deleteTopicInDb(topicId);
      if (!res.success) throw new Error(res.error || 'Could not delete topic.');
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) } : s
      )
    );
    setStudyNotes((prev) => prev.filter((n) => n.topicId !== topicId && n.entityId !== topicId));
    setLevelTests((prev) => prev.filter((t) => t.topicId !== topicId && t.entityId !== topicId));
    soundManager.playSubtleTick();
  };

  const reorderTopics = async (subjectId: SubjectId, fromIndex: number, toIndex: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= subject.topics.length ||
      toIndex >= subject.topics.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const nextTopics = [...subject.topics];
    const [moved] = nextTopics.splice(fromIndex, 1);
    nextTopics.splice(toIndex, 0, moved);

    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, topics: nextTopics } : s))
    );

    if (currentUser && !isDemo) {
      await reorderTopicsInDb(nextTopics.map((t) => t.id));
    }
    soundManager.playSubtleTick();
  };

  const addSubtopic = async (subjectId: SubjectId, topicId: string, name: string) => {
    const cleanName = name.trim();
    const subject = subjects.find((item) => item.id === subjectId);
    const topic = subject?.topics.find((item) => item.id === topicId);
    if (!topic) throw new Error('Select a topic before adding a subtopic.');
    if (!cleanName) throw new Error('Subtopic name is required.');
    if (topic.subtopics.some((subtopic) => subtopic.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('This subtopic already exists in the selected topic.');
    }

    const existingItems: SubtopicItem[] =
      topic.subtopicItems && topic.subtopicItems.length === topic.subtopics.length
        ? topic.subtopicItems
        : topic.subtopics.map((st, idx) => ({
            id: crypto.randomUUID(),
            topicId: topic.id,
            name: st,
            sortOrder: idx,
          }));

    const newItem: SubtopicItem = {
      id: crypto.randomUUID(),
      topicId: topic.id,
      name: cleanName,
      sortOrder: existingItems.length,
    };

    await persistSyllabus(subjects.map((item) => (
      item.id === subjectId
        ? {
            ...item,
            topics: item.topics.map((currentTopic) => (
              currentTopic.id === topicId
                ? {
                    ...currentTopic,
                    subtopics: [...currentTopic.subtopics, cleanName],
                    subtopicItems: [...existingItems, newItem],
                  }
                : currentTopic
            )),
          }
        : item
    )));
  };

  const updateSubtopic = async (
    subjectId: SubjectId,
    topicId: string,
    subtopicIndex: number,
    name: string
  ) => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Subtopic name is required.');
    const subject = subjects.find((s) => s.id === subjectId);
    const topic = subject?.topics.find((t) => t.id === topicId);
    if (!topic || subtopicIndex < 0 || subtopicIndex >= topic.subtopics.length) return;

    const existingItem = topic.subtopicItems?.[subtopicIndex];
    if (existingItem && currentUser && !isDemo) {
      const res = await updateSubtopicInDb(existingItem.id, { name: cleanName });
      if (!res.success) throw new Error(res.error || 'Could not update subtopic.');
    }

    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const nextSubtopics = t.subtopics.map((st, idx) => (idx === subtopicIndex ? cleanName : st));
            const nextItems = t.subtopicItems?.map((item, idx) =>
              idx === subtopicIndex ? { ...item, name: cleanName } : item
            );
            return { ...t, subtopics: nextSubtopics, subtopicItems: nextItems };
          }),
        };
      })
    );
    soundManager.playSubtleTick();
  };

  const deleteSubtopic = async (subjectId: SubjectId, topicId: string, subtopicIndex: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const topic = subject?.topics.find((t) => t.id === topicId);
    if (!topic || subtopicIndex < 0 || subtopicIndex >= topic.subtopics.length) return;

    const existingItem = topic.subtopicItems?.[subtopicIndex];
    if (existingItem && currentUser && !isDemo) {
      const res = await deleteSubtopicInDb(existingItem.id);
      if (!res.success) throw new Error(res.error || 'Could not delete subtopic.');
    }

    const removedId = existingItem?.id;

    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const nextSubtopics = t.subtopics.filter((_, idx) => idx !== subtopicIndex);
            const nextItems = t.subtopicItems
              ?.filter((_, idx) => idx !== subtopicIndex)
              .map((item, idx) => ({ ...item, sortOrder: idx }));
            return { ...t, subtopics: nextSubtopics, subtopicItems: nextItems };
          }),
        };
      })
    );

    if (removedId) {
      setStudyNotes((prev) => prev.filter((n) => n.subtopicId !== removedId && n.entityId !== removedId));
      setLevelTests((prev) => prev.filter((t) => t.subtopicId !== removedId && t.entityId !== removedId));
    }
    soundManager.playSubtleTick();
  };

  const reorderSubtopics = async (
    subjectId: SubjectId,
    topicId: string,
    fromIndex: number,
    toIndex: number
  ) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const topic = subject?.topics.find((t) => t.id === topicId);
    if (!topic) return;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= topic.subtopics.length ||
      toIndex >= topic.subtopics.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const nextSubtopics = [...topic.subtopics];
    const [movedName] = nextSubtopics.splice(fromIndex, 1);
    nextSubtopics.splice(toIndex, 0, movedName);

    let nextItems = topic.subtopicItems ? [...topic.subtopicItems] : undefined;
    if (nextItems && nextItems.length === topic.subtopics.length) {
      const [movedItem] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, movedItem);
      nextItems = nextItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, subtopics: nextSubtopics, subtopicItems: nextItems } : t
              ),
            }
          : s
      )
    );

    if (nextItems && currentUser && !isDemo) {
      await reorderSubtopicsInDb(nextItems.map((i) => i.id));
    }
    soundManager.playSubtleTick();
  };

  // ============================================================================
  // Role-Based Access & Hierarchical Notes / Tests State
  // ============================================================================
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [blockedAccountNotice, setBlockedAccountNotice] = useState<string | null>(null);
  const dismissBlockedAccountNotice = useCallback(() => {
    setBlockedAccountNotice(null);
  }, []);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [levelTests, setLevelTests] = useState<LevelTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [notesTestsLoading, setNotesTestsLoading] = useState<boolean>(false);
  const [notesTestsNotice, setNotesTestsNotice] = useState<string | null>(null);

  // Coin Economy & Competitive Leaderboard State
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [coinsLoading, setCoinsLoading] = useState<boolean>(false);
  const [lastCoinToast, setLastCoinToast] = useState<{ amount: number; reason: string } | null>(null);

  const dismissCoinToast = useCallback(() => {
    setLastCoinToast(null);
  }, []);

  useEffect(() => {
    if (!lastCoinToast) return;
    const timer = window.setTimeout(() => setLastCoinToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [lastCoinToast]);

  const isAdmin = userRole === 'admin';
  const canManageContent = userRole === 'admin' || userRole === 'content_manager';

  const canManageContentRef = React.useRef(canManageContent);
  canManageContentRef.current = canManageContent;
  const currentUserRef = React.useRef(currentUser);
  currentUserRef.current = currentUser;
  const userRoleRef = React.useRef(userRole);
  userRoleRef.current = userRole;
  const levelTestsRef = React.useRef(levelTests);
  levelTestsRef.current = levelTests;
  const testAttemptsRef = React.useRef(testAttempts);
  testAttemptsRef.current = testAttempts;
  const coinsLoadedOnceRef = React.useRef(false);

  const refreshNotesAndTests = useCallback(async (canManageOverride?: boolean) => {
    const uid = currentUserRef.current?.id;
    const allowContentSync = canManageOverride ?? canManageContentRef.current;
    setNotesTestsLoading(true);
    try {
      if (allowContentSync && !isDemo) {
        await syncLocalStudyNotesToCloud(isDemo);
      }

      const [notesRes, testsRes, attemptsRes] = await Promise.all([
        fetchAllStudyNotes(isDemo),
        fetchAllLevelTests(isDemo),
        fetchTestAttempts(uid, undefined, isDemo),
      ]);
      setStudyNotes(notesRes.data);
      setLevelTests(testsRes.data);
      setTestAttempts(attemptsRes.data);

      const usingLocalFallback =
        notesRes.usingLocalFallback || testsRes.usingLocalFallback || attemptsRes.usingLocalFallback;
      const notice = usingLocalFallback
        ? null
        : notesRes.error || testsRes.error || attemptsRes.error || null;
      setNotesTestsNotice(notice);
    } catch (err) {
      console.warn('Error loading hierarchical notes & tests:', err);
    } finally {
      setNotesTestsLoading(false);
    }
  }, [currentUser?.id, isDemo]);

  useEffect(() => {
    let active = true;
    const syncRoleAndContent = async () => {
      const user = currentUserRef.current;
      if (!user) {
        if (active) setUserRole('student');
        return;
      }
      let resolvedRole: UserRole = 'student';
      if (isDemo || user.isDemo) {
        resolvedRole = user.role || 'admin';
        if (active) setUserRole(resolvedRole);
      } else {
        // Immediately verify the user has not been blocked by an administrator
        const blockStatus = await fetchUserBlockStatus(user.id);
        if (!active) return;
        if (blockStatus.isBlocked) {
          await signOutUser();
          if (!active) return;
          setActiveUserId(null);
          setCurrentUser(null);
          setIsDemo(false);
          setUserRole('student');
          setBlockedAccountNotice(
            blockStatus.reason
              ? `Your account has been blocked by an administrator: ${blockStatus.reason}`
              : 'Your account has been blocked by an administrator and cannot access this portal.'
          );
          return;
        }

        resolvedRole = await fetchUserRole(user.id);
        if (active) setUserRole(resolvedRole);
      }
      if (active) {
        const allowManage = resolvedRole === 'admin' || resolvedRole === 'content_manager';
        await refreshNotesAndTests(allowManage);
      }
    };
    syncRoleAndContent();
    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.isDemo, isDemo, refreshNotesAndTests]);

  const saveStudyNote: StudyContextType['saveStudyNote'] = async (input) => {
    const res = await upsertStudyNote({
      ...input,
      userId: currentUser?.id,
      isDemo,
    });
    if (res.data) {
      setStudyNotes((prev) => {
        const idx = prev.findIndex(
          (n) =>
            n.entityType === res.data!.entityType &&
            n.entityId === res.data!.entityId &&
            n.noteType === res.data!.noteType
        );
        return idx >= 0
          ? prev.map((n, i) => (i === idx ? res.data! : n))
          : [res.data!, ...prev];
      });
      soundManager.playCompletionChime();
      return { success: true, note: res.data };
    }
    return { success: false, error: res.error || 'Could not save study note.' };
  };

  const removeStudyNote: StudyContextType['removeStudyNote'] = async (noteId) => {
    const res = await deleteStudyNote(noteId, isDemo);
    if (res.data) {
      setStudyNotes((prev) => prev.filter((n) => n.id !== noteId));
      soundManager.playSubtleTick();
      return { success: true };
    }
    return { success: false, error: res.error || 'Could not delete study note.' };
  };

  const refreshCoinsAndLeaderboard = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) {
      coinsLoadedOnceRef.current = false;
      setCoinBalance(0);
      setCoinTransactions([]);
      setLeaderboard([]);
      return;
    }
    if (!coinsLoadedOnceRef.current) {
      setCoinsLoading(true);
    }
    try {
      const coinState = await fetchCoinState(user.id, isDemo);
      setCoinBalance(coinState.balance);
      setCoinTransactions(coinState.transactions);

      const lbRes = await fetchCoinLeaderboard({
        currentUserId: user.id,
        currentUserName: user.fullName,
        currentUserRole: userRoleRef.current,
        currentUserBalance: coinState.balance,
        levelTests: levelTestsRef.current,
        testAttempts: testAttemptsRef.current,
        isDemo,
      });
      setLeaderboard(lbRes.entries);
      coinsLoadedOnceRef.current = true;
    } catch (err) {
      console.warn('Error refreshing coins & leaderboard:', err);
    } finally {
      setCoinsLoading(false);
    }
  }, [currentUser?.id, isDemo]);

  useEffect(() => {
    void refreshCoinsAndLeaderboard();
  }, [refreshCoinsAndLeaderboard, levelTests.length, testAttempts.length]);

  const addLevelTest: StudyContextType['addLevelTest'] = async (input) => {
    const res = await createLevelTest({
      ...input,
      userId: currentUser?.id,
      creatorName: currentUser?.fullName,
      isDemo,
    });
    if (res.data) {
      const createdTest = res.data;
      setLevelTests((prev) => [createdTest, ...prev]);

      let coinsAwarded: CoinAwardBreakdown | undefined;
      if (currentUser?.id) {
        const rewardItems = [
          {
            category: 'test_created' as const,
            amount: COINS_TEST_CREATE,
            reason: `Created test "${createdTest.title}"`,
          },
        ];
        const awardRes = await awardCoins({
          userId: currentUser.id,
          items: rewardItems,
          referenceId: createdTest.id,
          isDemo,
        });
        if (awardRes.totalAwarded > 0) {
          setCoinBalance((prev) => prev + awardRes.totalAwarded);
          setCoinTransactions((prev) => [...awardRes.transactions, ...prev]);
          setLastCoinToast({
            amount: awardRes.totalAwarded,
            reason: `Test created: "${createdTest.title}"`,
          });
          coinsAwarded = {
            totalCoins: awardRes.totalAwarded,
            items: rewardItems,
          };
        }
      }

      recordStudyActivityToday();
      soundManager.playCompletionChime();
      return { success: true, test: createdTest, coinsAwarded };
    }
    return { success: false, error: res.error || 'Could not create test.' };
  };

  const editLevelTest: StudyContextType['editLevelTest'] = async (testId, patch) => {
    const res = await updateLevelTest(testId, patch, isDemo);
    if (res.data) {
      setLevelTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                ...res.data!,
                questionCount: t.questionCount,
                attemptCount: t.attemptCount,
              }
            : t
        )
      );
      soundManager.playSubtleTick();
      return { success: true, test: res.data };
    }
    return { success: false, error: res.error || 'Could not update test.' };
  };

  const removeLevelTest: StudyContextType['removeLevelTest'] = async (testId) => {
    if (!isAdmin) {
      return {
        success: false,
        error: 'Only administrators can delete tests.',
      };
    }

    const targetTest = levelTests.find((t) => t.id === testId);
    const localAttemptCount = testAttempts.filter((a) => a.testId === testId).length;
    const knownAttemptCount = Math.max(targetTest?.attemptCount ?? 0, localAttemptCount);

    if (knownAttemptCount > 0) {
      return {
        success: false,
        error: 'This test cannot be deleted because one or more users have already attempted it.',
      };
    }

    const res = await deleteLevelTest(testId, isDemo, {
      isAdmin,
      knownAttemptCount,
    });
    if (res.data) {
      setLevelTests((prev) => prev.filter((t) => t.id !== testId));
      setTestAttempts((prev) => prev.filter((a) => a.testId !== testId));
      soundManager.playSubtleTick();
      return { success: true };
    }
    return { success: false, error: res.error || 'Could not delete test.' };
  };

  const recordTestAttempt: StudyContextType['recordTestAttempt'] = async (input) => {
    // Capture previous best BEFORE recording the new attempt so we compute fair rewards
    const priorAttemptsForTest = testAttempts.filter((a) => a.testId === input.testId);
    const previousBestPercentage =
      priorAttemptsForTest.length > 0
        ? Math.max(...priorAttemptsForTest.map((a) => a.percentage))
        : null;

    const res = await submitTestAttempt({
      ...input,
      userId: currentUser?.id,
      isDemo,
    });
    if (res.data) {
      const savedAttempt = res.data;
      setTestAttempts((prev) => [savedAttempt, ...prev]);
      setLevelTests((prev) =>
        prev.map((t) =>
          t.id === input.testId
            ? { ...t, attemptCount: (t.attemptCount ?? 0) + 1 }
            : t
        )
      );

      let coinsAwarded: CoinAwardBreakdown | undefined;
      if (currentUser?.id) {
        const targetTest = levelTests.find((t) => t.id === input.testId);
        const breakdown = calculateAttemptCoinReward(
          savedAttempt.percentage,
          previousBestPercentage,
          targetTest?.title || 'Assessment'
        );

        if (breakdown.totalCoins > 0) {
          const awardRes = await awardCoins({
            userId: currentUser.id,
            items: breakdown.items,
            referenceId: savedAttempt.id,
            isDemo,
          });
          if (awardRes.totalAwarded > 0) {
            setCoinBalance((prev) => prev + awardRes.totalAwarded);
            setCoinTransactions((prev) => [...awardRes.transactions, ...prev]);
            setLastCoinToast({
              amount: awardRes.totalAwarded,
              reason:
                previousBestPercentage === null
                  ? `Completed "${targetTest?.title || 'Test'}" (${savedAttempt.percentage}%)`
                  : `New personal best (${savedAttempt.percentage}%)`,
            });
            coinsAwarded = breakdown;
          }
        }
      }

      recordStudyActivityToday();
      soundManager.playCompletionChime();
      return { success: true, attempt: savedAttempt, coinsAwarded };
    }
    return { success: false, error: res.error || 'Could not record test attempt.' };
  };

  const updateTopicStatus = (subjectId: SubjectId, topicId: string, status: TopicStatus) => {
    setSubjects((prev) =>
      prev.map((subj) => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          topics: subj.topics.map((top) => {
            if (top.id !== topicId) return top;
            return {
              ...top,
              status,
              lastRevised: status === 'completed' ? getTodayLocalDateKey() : top.lastRevised,
            };
          }),
        };
      })
    );
    if (status === 'completed') {
      recordStudyActivityToday();
    }
    soundManager.playSubtleTick();
  };

  const updateTopicConfidence = (subjectId: SubjectId, topicId: string, confidence: number) => {
    setSubjects((prev) =>
      prev.map((subj) => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          topics: subj.topics.map((top) => {
            if (top.id !== topicId) return top;
            return { ...top, confidenceScore: confidence };
          }),
        };
      })
    );
  };

  const addMockTest = (mockData: Omit<MockTest, 'id'>) => {
    const newMock: MockTest = {
      ...mockData,
      id: `mock_${Date.now()}`,
    };
    setMockTests((prev) => [newMock, ...prev]);
    recordStudyActivityToday();
    soundManager.playCompletionChime();
  };

  const updateMockTest = (mockId: string, updates: Partial<MockTest>) => {
    setMockTests((prev) =>
      prev.map((m) => (m.id === mockId ? { ...m, ...updates } : m))
    );
    soundManager.playSubtleTick();
  };

  const deleteMockTest = (mockId: string) => {
    setMockTests((prev) => prev.filter((m) => m.id !== mockId));
    soundManager.playSubtleTick();
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `cal_${Date.now()}`,
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
    soundManager.playSubtleTick();
  };

  const updateCalendarEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );
    soundManager.playSubtleTick();
  };

  const deleteCalendarEvent = (eventId: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    soundManager.playSubtleTick();
  };

  const toggleCalendarEventCompletion = (eventId: string) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, completed: !e.completed } : e))
    );
    soundManager.playSubtleTick();
  };

  const addStudySessionHours = (minutes: number, subjectId?: SubjectId, topicTitle?: string) => {
    const newTask: Task = {
      id: `session_${Date.now()}`,
      title: `Focus Session: ${topicTitle || 'Deep Study Block'}`,
      subjectId: subjectId || subjects[0]?.id || '',
      topicTitle: topicTitle || 'Core Focus',
      type: 'concept',
      durationMinutes: minutes,
      completed: true,
      date: getTodayLocalDateKey(),
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: 'high',
    };
    setTasks((prev) => [newTask, ...prev]);
    recordStudyActivityToday();
    if (currentUser?.id) {
      syncTaskToSupabase(newTask, currentUser.id);
    }
  };

  // Real Consistent Streak Engine: computes live streak & syncs settings.streakCount automatically
  const streakInfo = useMemo(
    () =>
      computeStudyStreak({
        activeStudyDates: settings.activeStudyDates,
        tasks,
        testAttempts,
        levelTests,
        mockTests,
        subjects,
        currentUserId: currentUser?.id,
      }),
    [settings.activeStudyDates, tasks, testAttempts, levelTests, mockTests, subjects, currentUser?.id]
  );

  // Keep settings.streakCount always in sync with real computed streak so cloud state & peer profiles stay accurate
  useEffect(() => {
    if (settings.streakCount !== streakInfo.currentStreak) {
      setSettings((prev) =>
        prev.streakCount === streakInfo.currentStreak
          ? prev
          : { ...prev, streakCount: streakInfo.currentStreak }
      );
    }
  }, [streakInfo.currentStreak, settings.streakCount]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSubjects([]);
    setTasks([]);
    setSprints(INITIAL_SPRINTS);
    setMockTests([]);
    setMilestones(INITIAL_MILESTONES);
    setCalendarEvents([]);
    setBaseLoggedHours(0);
    setSettings(INITIAL_SETTINGS);
    soundManager.playSubtleTick();
  };

  const exportDataJson = () => {
    const data = {
      currentUser,
      subjects,
      tasks,
      sprints,
      mockTests,
      milestones,
      calendarEvents,
      settings,
      baseLoggedHours,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      const validSubjectIds = new Set<string>(
        Array.isArray(data.subjects)
          ? data.subjects.map((subject: Partial<Subject>) => subject.id).filter((id: unknown): id is string => typeof id === 'string')
          : subjects.map((subject) => subject.id)
      );
      const validTopicStatuses = new Set<string>(['completed', 'in_progress', 'revision_due', 'unvisited']);
      const validTaskTypes = new Set<string>(['concept', 'textbook', 'pyq', 'revision', 'test']);
      const validPriorities = new Set<string>(['urgent', 'high', 'normal']);
      const validEventTypes = new Set<string>(['mock', 'revision', 'milestone', 'study_block']);

      // 1. Strict validation for subjects
      if (data.subjects !== undefined) {
        if (!Array.isArray(data.subjects) || data.subjects.length > 25) {
          return false;
        }
        for (const s of data.subjects) {
          if (!s || typeof s !== 'object') return false;
          if (typeof s.id !== 'string' || typeof s.name !== 'string' || !Array.isArray(s.topics)) {
            return false;
          }
          if (s.topics.length > 100) return false;
          for (const t of s.topics) {
            if (!t || typeof t !== 'object') return false;
            if (typeof t.id !== 'string' || typeof t.title !== 'string') return false;
            if (!validTopicStatuses.has(t.status)) return false;
            if (typeof t.confidenceScore !== 'number' || t.confidenceScore < 1 || t.confidenceScore > 5) return false;
            if (typeof t.pyqsSolved !== 'number' || t.pyqsSolved < 0 || t.pyqsSolved > 10000) return false;
            if (typeof t.pyqsTotal !== 'number' || t.pyqsTotal < 0 || t.pyqsTotal > 10000) return false;
            if (typeof t.pyqAccuracy !== 'number' || t.pyqAccuracy < 0 || t.pyqAccuracy > 100) return false;
          }
        }
      }

      // 2. Strict validation for tasks
      if (data.tasks !== undefined) {
        if (!Array.isArray(data.tasks) || data.tasks.length > 1000) return false;
        for (const task of data.tasks) {
          if (!task || typeof task !== 'object') return false;
          if (typeof task.id !== 'string' || task.id.length === 0 || task.id.length > 128) return false;
          if (typeof task.title !== 'string' || task.title.length === 0 || task.title.length > 300) return false;
          if (!validSubjectIds.has(task.subjectId)) return false;
          if (!validTaskTypes.has(task.type)) return false;
          if (typeof task.durationMinutes !== 'number' || task.durationMinutes < 1 || task.durationMinutes > 1440) return false;
          if (typeof task.completed !== 'boolean') return false;
          if (typeof task.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(task.date)) return false;
          if (!validPriorities.has(task.priority)) return false;
        }
      }

      // 3. Strict validation for mockTests
      if (data.mockTests !== undefined) {
        if (!Array.isArray(data.mockTests) || data.mockTests.length > 200) return false;
        for (const m of data.mockTests) {
          if (!m || typeof m !== 'object') return false;
          if (typeof m.id !== 'string' || typeof m.title !== 'string') return false;
          if (typeof m.score !== 'number' || m.score < 0 || m.score > 100 || isNaN(m.score)) return false;
          if (typeof m.accuracy !== 'number' || m.accuracy < 0 || m.accuracy > 100) return false;
          if (typeof m.date !== 'string') return false;
        }
      }

      // 4. Strict validation for calendarEvents
      if (data.calendarEvents !== undefined) {
        if (!Array.isArray(data.calendarEvents) || data.calendarEvents.length > 500) return false;
        for (const e of data.calendarEvents) {
          if (!e || typeof e !== 'object') return false;
          if (typeof e.id !== 'string' || typeof e.title !== 'string') return false;
          if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return false;
          if (!validEventTypes.has(e.type)) return false;
        }
      }

      // 5. Strict validation for milestones
      if (data.milestones !== undefined) {
        if (!Array.isArray(data.milestones) || data.milestones.length > 50) return false;
        for (const ms of data.milestones) {
          if (!ms || typeof ms !== 'object') return false;
          if (typeof ms.id !== 'string' || typeof ms.phaseTitle !== 'string') return false;
        }
      }

      // 6. Strict validation for settings
      if (data.settings !== undefined) {
        if (!data.settings || typeof data.settings !== 'object') return false;
        const s = data.settings;
        if (typeof s.targetAir !== 'number' || s.targetAir < 1 || s.targetAir > 100000) return false;
        if (typeof s.targetYear !== 'number' || s.targetYear < 2025 || s.targetYear > 2035) return false;
        if (typeof s.dailyGoalHours !== 'number' || s.dailyGoalHours < 0 || s.dailyGoalHours > 24) return false;
        if (typeof s.weeklyGoalHours !== 'number' || s.weeklyGoalHours < 0 || s.weeklyGoalHours > 168) return false;
        if (typeof s.streakCount !== 'number' || s.streakCount < 0) return false;
      }

      // 7. Strict validation for baseLoggedHours
      if (data.baseLoggedHours !== undefined) {
        if (typeof data.baseLoggedHours !== 'number' || data.baseLoggedHours < 0 || data.baseLoggedHours > 50000 || isNaN(data.baseLoggedHours)) {
          return false;
        }
      }

      // ALL VALIDATIONS PASSED: Install state atomically
      if (data.subjects) setSubjects(data.subjects);
      if (data.tasks) setTasks(data.tasks);
      if (data.sprints && Array.isArray(data.sprints)) setSprints(data.sprints);
      if (data.mockTests) setMockTests(data.mockTests);
      if (data.milestones) setMilestones(data.milestones);
      if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
      if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      if (data.baseLoggedHours !== undefined) setBaseLoggedHours(data.baseLoggedHours);

      soundManager.playCompletionChime();
      return true;
    } catch {
      return false;
    }
  };

  // Timer controls
  const startTimer = () => {
    soundManager.playFocusAlert();
    setTimerState((prev) => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    soundManager.playSubtleTick();
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    soundManager.playSubtleTick();
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      timeLeft: prev.initialTime,
    }));
  };

  const setTimerMode = (mode: 'focus' | 'short_break' | 'long_break') => {
    let secs = 25 * 60;
    if (mode === 'short_break') secs = 5 * 60;
    if (mode === 'long_break') secs = 15 * 60;

    setTimerState((prev) => ({
      ...prev,
      mode,
      isRunning: false,
      initialTime: secs,
      timeLeft: secs,
    }));
  };

  const setTimerSubject = (subjectId: SubjectId, topicTitle: string) => {
    setTimerState((prev) => ({
      ...prev,
      subjectId,
      topicTitle,
    }));
  };

  // Perform full bi-directional or directed synchronization with Linked Applet (2a25406d)
  const syncWithLinkedApplet = useCallback(
    async (direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional') => {
      setIsSyncingLinkedApplet(true);
      setLinkedSyncMessage(`Connecting to linked applet ${DEFAULT_LINKED_APPLET_ID}...`);
      try {
        let mergedResult: any = null;
        if (direction === 'pull' || direction === 'bidirectional') {
          const pullRes = await pullSyncFromLinkedApplet();
          if (pullRes.success && pullRes.payload) {
            mergedResult = mergeRemotePayloadIntoLocal(
              subjects,
              tasks,
              mockTests,
              totalHoursStudied,
              settings,
              pullRes.payload
            );
            setSubjects(mergedResult.mergedSubjects);
            setTasks(mergedResult.mergedTasks);
            setMockTests(mergedResult.mergedMocks);
            setBaseLoggedHours(mergedResult.mergedHours);
            setSettings(mergedResult.mergedSettings);
          }
        }

        const subjectsToPush = mergedResult ? mergedResult.mergedSubjects : subjects;
        const tasksToPush = mergedResult ? mergedResult.mergedTasks : tasks;
        const mocksToPush = mergedResult ? mergedResult.mergedMocks : mockTests;
        const hoursToPush = mergedResult ? mergedResult.mergedHours : totalHoursStudied;
        const settingsToPush = mergedResult ? mergedResult.mergedSettings : settings;

        const payload = buildSyncPayload(
          currentUser,
          subjectsToPush,
          hoursToPush,
          tasksToPush,
          mocksToPush,
          settingsToPush
        );

        const pushRes = await pushSyncToLinkedApplet(payload, { includeServerApi: true });
        const freshConfig = getLinkedAppletConfig();
        setLinkedAppletConfig(freshConfig);
        const msg = mergedResult
          ? `${mergedResult.changesSummary} · ${pushRes.message}`
          : pushRes.message;
        setLinkedSyncMessage(msg);
        soundManager.playCompletionChime();
        return { success: true, message: msg };
      } catch (err: any) {
        console.error('syncWithLinkedApplet error:', err);
        const errMsg = err?.message || 'Sync encountered an error';
        setLinkedSyncMessage(errMsg);
        return { success: false, message: errMsg };
      } finally {
        setIsSyncingLinkedApplet(false);
      }
    },
    [currentUser, subjects, totalHoursStudied, tasks, mockTests, settings]
  );

  // Real-time broadcast channel subscription across open companion applet tabs
  useEffect(() => {
    const unsubscribe = subscribeToLinkedAppletBroadcast((remotePayload) => {
      if (remotePayload && remotePayload.syllabus) {
        setSubjects((prevSubjects) => {
          const merged = mergeRemotePayloadIntoLocal(
            prevSubjects,
            tasks,
            mockTests,
            totalHoursStudied,
            settings,
            remotePayload
          );
          return merged.mergedSubjects;
        });
        setLinkedSyncMessage(`Live update received from linked applet (${DEFAULT_LINKED_APPLET_ID}).`);
        setTimeout(() => setLinkedSyncMessage(null), 4000);
      }
    });
    return unsubscribe;
  }, [tasks, mockTests, totalHoursStudied, settings]);

  // Debounced auto-sync to linked applet when autoSync is enabled (only for authenticated real users)
  useEffect(() => {
    if (!linkedAppletConfig.autoSync || isDemo || !currentUser) return;
    const abortController = new AbortController();
    const timeout = setTimeout(async () => {
      if (abortController.signal.aborted) return;
      try {
        const payload = buildSyncPayload(
          currentUser,
          subjects,
          totalHoursStudied,
          tasks,
          mockTests,
          settings
        );
        await pushSyncToLinkedApplet(payload, { includeServerApi: false });
      } catch (err) {
        console.warn('Auto-sync notice:', err);
      }
    }, 3500);

    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [subjects, tasks, mockTests, totalHoursStudied, linkedAppletConfig.autoSync, currentUser?.id, isDemo, settings]);

  return (
    <StudyContext.Provider
      value={{
        currentUser,
        allUsers,
        isDemo,
        authLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        blockedAccountNotice,
        dismissBlockedAccountNotice,
        chatGroupJoinError,
        ensureChatGroupMembership,
        login,
        register,
        logout,
        switchUser,
        loginAsDemo,
        isDbConnected,
        isSyncingDb,
        dbSyncMessage,
        dbStats,
        syncSyllabusToDb,
        fetchSyllabusFromDb,
        linkedAppletConfig,
        isSyncingLinkedApplet,
        linkedSyncMessage,
        syncWithLinkedApplet,
        updateLinkedAppletConfig,
        toggleLinkedAutoSync,
        isLinkedSyncModalOpen,
        setIsLinkedSyncModalOpen,
        subjects,
        tasks,
        sprints,
        selectedSprintWeek,
        setSelectedSprintWeek,
        mockTests,
        milestones,
        calendarEvents,
        settings,
        activeView,
        setActiveView,
        totalTopics,
        completedTopics,
        syllabusPercent,
        totalHoursStudied,
        totalPyqsSolved,
        totalPyqsOverall,
        overallPyqAccuracy,
        daysRemaining,
        revisionDueCount,
        streakInfo,
        toggleTaskCompletion,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        assignTaskToSprint,
        bulkAssignTasksToSprint,
        createSprint,
        updateSprint,
        completeSprint,
        deleteSprint,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopic,
        updateTopic,
        deleteTopic,
        reorderTopics,
        addSubtopic,
        updateSubtopic,
        deleteSubtopic,
        reorderSubtopics,
        updateTopicStatus,
        updateTopicConfidence,
        userRole,
        isAdmin,
        canManageContent,
        studyNotes,
        levelTests,
        testAttempts,
        notesTestsLoading,
        notesTestsNotice,
        refreshNotesAndTests,
        saveStudyNote,
        removeStudyNote,
        addLevelTest,
        editLevelTest,
        removeLevelTest,
        recordTestAttempt,
        coinBalance,
        coinTransactions,
        leaderboard,
        coinsLoading,
        lastCoinToast,
        dismissCoinToast,
        refreshCoinsAndLeaderboard,
        addMockTest,
        updateMockTest,
        deleteMockTest,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        toggleCalendarEventCompletion,
        addStudySessionHours,
        updateSettings,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        timerState,
        startTimer,
        pauseTimer,
        resetTimer,
        setTimerMode,
        setTimerSubject,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
