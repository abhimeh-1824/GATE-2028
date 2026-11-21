import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  LinkedAppletConfig,
  AppletSyncPayload,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_SPRINTS,
  INITIAL_MOCK_TESTS,
  INITIAL_MILESTONES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_SETTINGS,
  createFreshZeroSubjects,
} from '../data/gateDaSyllabus';
import { soundManager } from '../utils/audio';
import { supabase } from '../lib/supabase';
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
} from '../lib/supabaseService';
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
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  register: (
    email: string,
    pass: string,
    fullName: string,
    targetAir?: number,
    targetCollege?: string
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  loginAsDemo: () => void;

  // Supabase Database Sync (Read-only for canonical syllabus, user progress owned)
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
  updateTopicStatus: (subjectId: SubjectId, topicId: string, status: TopicStatus) => void;
  updateTopicConfidence: (subjectId: SubjectId, topicId: string, confidence: number) => void;
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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper to get user-specific storage key
  const getUserKey = (key: string, userId?: string) => {
    const id = isDemo ? 'demo_sandbox' : userId || currentUser?.id || 'guest';
    return `${USER_DATA_PREFIX}${id}_${key}`;
  };

  // State initialization helper
  const loadInitialData = (user: AuthUser | null, isDemoMode: boolean = false) => {
    if (isDemoMode || user?.isDemo || user?.id?.startsWith('demo_')) {
      return {
        subjects: INITIAL_SUBJECTS,
        tasks: INITIAL_TASKS,
        sprints: INITIAL_SPRINTS,
        mockTests: INITIAL_MOCK_TESTS,
        milestones: INITIAL_MILESTONES,
        calendarEvents: INITIAL_CALENDAR_EVENTS,
        baseLoggedHours: 412.5,
        settings: {
          ...INITIAL_SETTINGS,
          userName: 'Demo Aspirant',
          targetAir: 1,
          targetCollege: 'IISc Bangalore (M.Tech AI)',
          shareProgressWithCohort: false,
        },
      };
    }

    const id = user?.id || 'guest';
    const isNewUser = user && !localStorage.getItem(`${USER_DATA_PREFIX}${id}_initialized`);

    if (isNewUser) {
      // BRAND NEW USER: Starts from 0!
      // 0% syllabus, 0 tasks, 0 mock tests, 0 hours
      localStorage.setItem(`${USER_DATA_PREFIX}${id}_initialized`, 'true');
      return {
        subjects: createFreshZeroSubjects(),
        tasks: [],
        sprints: INITIAL_SPRINTS,
        mockTests: [],
        milestones: INITIAL_MILESTONES,
        calendarEvents: [],
        baseLoggedHours: 0.0,
        settings: {
          targetAir: user.targetAir || 1,
          targetYear: 2028,
          examDate: '2028-02-13',
          dailyGoalHours: 4.5,
          weeklyGoalHours: 28,
          streakCount: 1,
          userName: user.fullName || 'Aspirant',
          targetCollege: user.targetCollege || 'IISc Bangalore (M.Tech AI)',
          shareProgressWithCohort: false,
        },
      };
    }

    // Try loading existing user data from local cache
    try {
      const savedSubjects = localStorage.getItem(`${USER_DATA_PREFIX}${id}_subjects`);
      const savedTasks = localStorage.getItem(`${USER_DATA_PREFIX}${id}_tasks`);
      const savedSprints = localStorage.getItem(`${USER_DATA_PREFIX}${id}_sprints`);
      const savedMocks = localStorage.getItem(`${USER_DATA_PREFIX}${id}_mockTests`);
      const savedMilestones = localStorage.getItem(`${USER_DATA_PREFIX}${id}_milestones`);
      const savedCal = localStorage.getItem(`${USER_DATA_PREFIX}${id}_calendarEvents`);
      const savedSettings = localStorage.getItem(`${USER_DATA_PREFIX}${id}_settings`);
      const savedHours = localStorage.getItem(`${USER_DATA_PREFIX}${id}_baseHours`);

      return {
        subjects: savedSubjects ? JSON.parse(savedSubjects) : (user ? createFreshZeroSubjects() : INITIAL_SUBJECTS),
        tasks: savedTasks ? JSON.parse(savedTasks) : (user ? [] : INITIAL_TASKS),
        sprints: savedSprints ? JSON.parse(savedSprints) : INITIAL_SPRINTS,
        mockTests: savedMocks ? JSON.parse(savedMocks) : [],
        milestones: savedMilestones ? JSON.parse(savedMilestones) : INITIAL_MILESTONES,
        calendarEvents: savedCal ? JSON.parse(savedCal) : [],
        baseLoggedHours: savedHours ? Number(savedHours) : 0.0,
        settings: savedSettings
          ? JSON.parse(savedSettings)
          : user
          ? {
              targetAir: user.targetAir || 1,
              targetYear: 2028,
              examDate: '2028-02-13',
              dailyGoalHours: 4.5,
              weeklyGoalHours: 28,
              streakCount: 1,
              userName: user.fullName,
              targetCollege: user.targetCollege,
              shareProgressWithCohort: false,
            }
          : INITIAL_SETTINGS,
      };
    } catch {
      return {
        subjects: user ? createFreshZeroSubjects() : INITIAL_SUBJECTS,
        tasks: user ? [] : INITIAL_TASKS,
        sprints: INITIAL_SPRINTS,
        mockTests: [],
        milestones: INITIAL_MILESTONES,
        calendarEvents: [],
        baseLoggedHours: 0.0,
        settings: INITIAL_SETTINGS,
      };
    }
  };

  const initialData = loadInitialData(null);

  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [sprints, setSprints] = useState<SprintPlan[]>(initialData.sprints || INITIAL_SPRINTS);
  const [selectedSprintWeek, setSelectedSprintWeek] = useState<string>('2026-W40');
  const [mockTests, setMockTests] = useState<MockTest[]>(initialData.mockTests);
  const [milestones, setMilestones] = useState<Milestone[]>(initialData.milestones);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialData.calendarEvents);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  const [baseLoggedHours, setBaseLoggedHours] = useState<number>(initialData.baseLoggedHours);

  // Supabase Database Syllabus Sync
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbSyncMessage, setDbSyncMessage] = useState<string>('Official syllabus verified and read-only');
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
    // Only query database if user is authenticated and not demo
    if (isDemo || !currentUser) {
      setDbSyncMessage('Official syllabus loaded from canonical course definition');
      return;
    }
    setIsSyncingDb(true);
    try {
      const result = await fetchSyllabusFromDatabase(subjects);
      setIsDbConnected(true);
      setDbStats(result.stats);
      setDbSyncMessage(result.message);
      if (result.isFromDatabase && result.subjects.length > 0) {
        setSubjects(result.subjects);
      }
    } catch (e: any) {
      console.warn('fetchSyllabusFromDb err:', e);
      setDbSyncMessage(e?.message || 'Database query finished');
    } finally {
      setIsSyncingDb(false);
    }
  }, [subjects, isDemo, currentUser]);

  // Canonical syllabus is strictly read-only for students
  const syncSyllabusToDb = useCallback(async () => {
    setDbSyncMessage('Canonical curriculum is read-only. Your topic mastery and status are tracked in your profile.');
    soundManager.playSubtleTick();
  }, []);

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

        // Load data for verified user
        const userData = loadInitialData(verifiedUser, false);
        setSubjects(userData.subjects);
        setTasks(userData.tasks);
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
          setCurrentUser(verifiedUser);
          setIsDemo(false);
          setAllUsers(getSavedAccounts());
        }
      } else if (event === 'SIGNED_OUT') {
        setActiveUserId(null);
        setCurrentUser(null);
        setIsDemo(false);
        setSubjects(createFreshZeroSubjects());
        setTasks([]);
        setSprints(INITIAL_SPRINTS);
        setMockTests([]);
        setCalendarEvents([]);
        setBaseLoggedHours(0.0);
        setSettings(INITIAL_SETTINGS);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    subjectId: 'linear_algebra',
    topicTitle: 'Projections, LU Decomposition & SVD',
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

    // Load new user's isolated data atomically
    const data = loadInitialData(target, targetIsDemo);
    setSubjects(data.subjects);
    setTasks(data.tasks);
    setSprints(data.sprints || INITIAL_SPRINTS);
    setMockTests(data.mockTests);
    setMilestones(data.milestones);
    setCalendarEvents(data.calendarEvents);
    setSettings(data.settings);
    setBaseLoggedHours(data.baseLoggedHours);

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

  // Save current user data whenever state updates (strictly suspended during user transitions or loading)
  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_subjects`, JSON.stringify(subjects));
  }, [subjects, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_tasks`, JSON.stringify(tasks));
  }, [tasks, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_sprints`, JSON.stringify(sprints));
  }, [sprints, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_mockTests`, JSON.stringify(mockTests));
  }, [mockTests, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_milestones`, JSON.stringify(milestones));
  }, [milestones, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_calendarEvents`, JSON.stringify(calendarEvents));
  }, [calendarEvents, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_settings`, JSON.stringify(settings));
  }, [settings, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  useEffect(() => {
    if (isSwitchingUser || authLoading) return;
    const id = isDemo ? 'demo_sandbox' : currentUser?.id;
    if (!id) return;
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_baseHours`, String(baseLoggedHours));
  }, [baseLoggedHours, currentUser?.id, isDemo, isSwitchingUser, authLoading]);

  // Auth Operations
  const login = async (email: string, pass: string) => {
    const res = await signInUser(email, pass);
    if (res.user) {
      setAllUsers(getSavedAccounts());
      await switchUser(res.user.id);
      return { success: true, needsEmailConfirmation: res.needsEmailConfirmation };
    }
    return { success: false, error: res.error || 'Authentication failed.' };
  };

  const register = async (
    email: string,
    pass: string,
    fullName: string,
    targetAir: number = 1,
    targetCollege: string = 'IISc Bangalore (M.Tech AI)'
  ) => {
    const res = await signUpUser(email, pass, fullName, targetAir, targetCollege);
    if (res.user) {
      setAllUsers(getSavedAccounts());
      await switchUser(res.user.id);
      return { success: true, needsEmailConfirmation: res.needsEmailConfirmation };
    }
    return { success: false, error: res.error || 'Registration failed.' };
  };

  const logout = () => {
    signOutUser();
    setIsDemo(false);
    setCurrentUser(null);
    setActiveUserId(null);

    // Revert to clean guest state
    setSubjects(createFreshZeroSubjects());
    setTasks([]);
    setMockTests([]);
    setCalendarEvents([]);
    setBaseLoggedHours(0.0);
    setSettings(INITIAL_SETTINGS);
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
              lastRevised: status === 'completed' ? new Date().toISOString().split('T')[0] : top.lastRevised,
            };
          }),
        };
      })
    );
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
      subjectId: subjectId || 'linear_algebra',
      topicTitle: topicTitle || 'Core Focus',
      type: 'concept',
      durationMinutes: minutes,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: 'high',
    };
    setTasks((prev) => [newTask, ...prev]);
    if (currentUser?.id) {
      syncTaskToSupabase(newTask, currentUser.id);
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSubjects(currentUser ? createFreshZeroSubjects() : INITIAL_SUBJECTS);
    setTasks(currentUser ? [] : INITIAL_TASKS);
    setMockTests(currentUser ? [] : INITIAL_MOCK_TESTS);
    setMilestones(INITIAL_MILESTONES);
    setCalendarEvents(currentUser ? [] : INITIAL_CALENDAR_EVENTS);
    setBaseLoggedHours(currentUser ? 0.0 : 412.5);
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

      const validSubjectIds = new Set<string>([
        'prob_stat',
        'linear_algebra',
        'calculus_opt',
        'dsa_python',
        'dbms_warehouse',
        'machine_learning',
        'artificial_intel',
        'general_aptitude',
        'mock_pyq',
      ]);
      const validTopicStatuses = new Set<string>(['completed', 'in_progress', 'revision_due', 'unvisited']);
      const validTaskTypes = new Set<string>(['concept', 'textbook', 'pyq', 'revision', 'test']);
      const validPriorities = new Set<string>(['urgent', 'high', 'normal']);
      const validEventTypes = new Set<string>(['mock', 'revision', 'milestone', 'study_block']);

      // 1. Strict validation for subjects
      if (data.subjects !== undefined) {
        if (!Array.isArray(data.subjects) || data.subjects.length === 0 || data.subjects.length > 25) {
          return false;
        }
        for (const s of data.subjects) {
          if (!s || typeof s !== 'object') return false;
          if (!validSubjectIds.has(s.id) || typeof s.name !== 'string' || !Array.isArray(s.topics)) {
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

        const pushRes = await pushSyncToLinkedApplet(payload);
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
        await pushSyncToLinkedApplet(payload);
      } catch (err) {
        console.warn('Auto-sync notice:', err);
      }
    }, 3500);

    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [subjects, tasks, mockTests, totalHoursStudied, linkedAppletConfig.autoSync, currentUser, isDemo, settings]);

  return (
    <StudyContext.Provider
      value={{
        currentUser,
        allUsers,
        isDemo,
        authLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
        updateTopicStatus,
        updateTopicConfidence,
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
