import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Subject,
  Topic,
  Task,
  MockTest,
  Milestone,
  CalendarEvent,
  UserSettings,
  TopicStatus,
  SubjectId,
  AuthUser,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_MOCK_TESTS,
  INITIAL_MILESTONES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_SETTINGS,
  createFreshZeroSubjects,
} from '../data/gateDaSyllabus';
import { soundManager } from '../utils/audio';
import {
  signUpUser,
  signInUser,
  signOutUser,
  getSavedAccounts,
  getActiveUserId,
  setActiveUserId,
  syncTaskToSupabase,
  deleteTaskFromSupabase,
  loadTasksFromSupabase,
  fetchSyllabusFromDatabase,
  saveSyllabusToDatabase,
} from '../lib/supabaseService';

interface StudyContextType {
  // Auth & Multiple Users
  currentUser: AuthUser | null;
  allUsers: AuthUser[];
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

  // Supabase Database Sync
  isDbConnected: boolean;
  isSyncingDb: boolean;
  dbSyncMessage: string;
  dbStats: { subjectsCount: number; topicsCount: number; subtopicsCount: number };
  syncSyllabusToDb: () => Promise<void>;
  fetchSyllabusFromDb: () => Promise<void>;

  // Study Data
  subjects: Subject[];
  tasks: Task[];
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
  deleteTask: (taskId: string) => void;
  updateTopicStatus: (subjectId: SubjectId, topicId: string, status: TopicStatus) => void;
  updateTopicConfidence: (subjectId: SubjectId, topicId: string, confidence: number) => void;
  addMockTest: (mock: Omit<MockTest, 'id'>) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
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
  // Accounts and Current User
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => getSavedAccounts());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const activeId = getActiveUserId();
    const saved = getSavedAccounts();
    if (activeId) {
      return saved.find((u) => u.id === activeId) || null;
    }
    // If there's an account, default to the first one, or null
    return saved.length > 0 ? saved[0] : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper to get user-specific storage key
  const getUserKey = (key: string, userId?: string) => {
    const id = userId || currentUser?.id || 'guest';
    return `${USER_DATA_PREFIX}${id}_${key}`;
  };

  // State initialization helper
  const loadInitialData = (user: AuthUser | null) => {
    const id = user?.id || 'guest';
    const isNewUser = user && !localStorage.getItem(`${USER_DATA_PREFIX}${id}_initialized`);

    if (isNewUser) {
      // BRAND NEW USER: Starts from 0!
      // 0% syllabus, 0 tasks, 0 mock tests, 0 hours
      localStorage.setItem(`${USER_DATA_PREFIX}${id}_initialized`, 'true');
      return {
        subjects: createFreshZeroSubjects(),
        tasks: [],
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
        },
      };
    }

    // Try loading existing user data
    try {
      const savedSubjects = localStorage.getItem(`${USER_DATA_PREFIX}${id}_subjects`);
      const savedTasks = localStorage.getItem(`${USER_DATA_PREFIX}${id}_tasks`);
      const savedMocks = localStorage.getItem(`${USER_DATA_PREFIX}${id}_mockTests`);
      const savedMilestones = localStorage.getItem(`${USER_DATA_PREFIX}${id}_milestones`);
      const savedCal = localStorage.getItem(`${USER_DATA_PREFIX}${id}_calendarEvents`);
      const savedSettings = localStorage.getItem(`${USER_DATA_PREFIX}${id}_settings`);
      const savedHours = localStorage.getItem(`${USER_DATA_PREFIX}${id}_baseHours`);

      return {
        subjects: savedSubjects ? JSON.parse(savedSubjects) : (user ? createFreshZeroSubjects() : INITIAL_SUBJECTS),
        tasks: savedTasks ? JSON.parse(savedTasks) : (user ? [] : INITIAL_TASKS),
        mockTests: savedMocks ? JSON.parse(savedMocks) : (user ? [] : INITIAL_MOCK_TESTS),
        milestones: savedMilestones ? JSON.parse(savedMilestones) : INITIAL_MILESTONES,
        calendarEvents: savedCal ? JSON.parse(savedCal) : (user ? [] : INITIAL_CALENDAR_EVENTS),
        baseLoggedHours: savedHours ? Number(savedHours) : (user ? 0.0 : 412.5),
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
            }
          : INITIAL_SETTINGS,
      };
    } catch {
      return {
        subjects: user ? createFreshZeroSubjects() : INITIAL_SUBJECTS,
        tasks: user ? [] : INITIAL_TASKS,
        mockTests: user ? [] : INITIAL_MOCK_TESTS,
        milestones: INITIAL_MILESTONES,
        calendarEvents: user ? [] : INITIAL_CALENDAR_EVENTS,
        baseLoggedHours: user ? 0.0 : 412.5,
        settings: INITIAL_SETTINGS,
      };
    }
  };

  const initialData = loadInitialData(currentUser);

  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [mockTests, setMockTests] = useState<MockTest[]>(initialData.mockTests);
  const [milestones, setMilestones] = useState<Milestone[]>(initialData.milestones);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialData.calendarEvents);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  const [baseLoggedHours, setBaseLoggedHours] = useState<number>(initialData.baseLoggedHours);

  // Supabase Database Syllabus Sync
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbSyncMessage, setDbSyncMessage] = useState<string>('Connected to Supabase database');
  const [dbStats, setDbStats] = useState<{ subjectsCount: number; topicsCount: number; subtopicsCount: number }>({
    subjectsCount: initialData.subjects.length,
    topicsCount: initialData.subjects.reduce((acc: number, s: Subject) => acc + s.topics.length, 0),
    subtopicsCount: initialData.subjects.reduce(
      (acc: number, s: Subject) => acc + s.topics.reduce((tAcc: number, t: Topic) => tAcc + (t.subtopics?.length || 0), 0),
      0
    ),
  });

  const fetchSyllabusFromDb = useCallback(async () => {
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
  }, [subjects]);

  const syncSyllabusToDb = useCallback(async () => {
    setIsSyncingDb(true);
    try {
      const res = await saveSyllabusToDatabase(subjects);
      setDbSyncMessage(res.message);
      setDbStats({
        subjectsCount: res.subjectsSaved,
        topicsCount: res.topicsSaved,
        subtopicsSaved: res.subtopicsSaved,
      } as any);
      if (res.success) {
        soundManager.playCompletionChime();
      }
    } catch (e: any) {
      console.warn('syncSyllabusToDb err:', e);
      setDbSyncMessage(e?.message || 'Sync failed');
    } finally {
      setIsSyncingDb(false);
    }
  }, [subjects]);

  // Initial DB check on mount
  useEffect(() => {
    fetchSyllabusFromDatabase(initialData.subjects).then((res) => {
      setDbStats(res.stats);
      setDbSyncMessage(res.message);
      if (res.isFromDatabase && res.subjects.length > 0) {
        setSubjects(res.subjects);
      }
    }).catch((err) => {
      console.warn('Initial fetchSyllabusFromDatabase notice:', err);
    });
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

  // Switch user handler
  const switchUser = useCallback((userId: string) => {
    const saved = getSavedAccounts();
    const target = saved.find((u) => u.id === userId);
    if (!target) return;

    setActiveUserId(target.id);
    setCurrentUser(target);

    // Load new user's isolated data
    const data = loadInitialData(target);
    setSubjects(data.subjects);
    setTasks(data.tasks);
    setMockTests(data.mockTests);
    setMilestones(data.milestones);
    setCalendarEvents(data.calendarEvents);
    setSettings(data.settings);
    setBaseLoggedHours(data.baseLoggedHours);

    // Attempt to load tasks from Supabase cloud
    loadTasksFromSupabase(target.id).then((remoteTasks) => {
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

    soundManager.playSubtleTick();
  }, []);

  // Save current user data whenever state updates
  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_subjects`, JSON.stringify(subjects));
  }, [subjects, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_tasks`, JSON.stringify(tasks));
  }, [tasks, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_mockTests`, JSON.stringify(mockTests));
  }, [mockTests, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_milestones`, JSON.stringify(milestones));
  }, [milestones, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_calendarEvents`, JSON.stringify(calendarEvents));
  }, [calendarEvents, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_settings`, JSON.stringify(settings));
  }, [settings, currentUser?.id]);

  useEffect(() => {
    const id = currentUser?.id || 'guest';
    localStorage.setItem(`${USER_DATA_PREFIX}${id}_baseHours`, String(baseLoggedHours));
  }, [baseLoggedHours, currentUser?.id]);

  // Auth Operations
  const login = async (email: string, pass: string) => {
    const res = await signInUser(email, pass);
    if (res.user) {
      setAllUsers(getSavedAccounts());
      switchUser(res.user.id);
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
      switchUser(res.user.id);
      return { success: true, needsEmailConfirmation: res.needsEmailConfirmation };
    }
    return { success: false, error: res.error || 'Registration failed.' };
  };

  const logout = () => {
    signOutUser();
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

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (timerState.isRunning && timerState.timeLeft === 0) {
      soundManager.playFocusAlert();
      if (timerState.mode === 'focus') {
        const mins = Math.round(timerState.initialTime / 60);
        addStudySessionHours(mins, timerState.subjectId, timerState.topicTitle);
      }
      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
      }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.timeLeft, timerState.mode, timerState.initialTime, timerState.subjectId, timerState.topicTitle]);

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
          const updated = { ...task, completed: nextState };
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
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setTasks((prev) => [newTask, ...prev]);
    if (currentUser?.id) {
      syncTaskToSupabase(newTask, currentUser.id);
    }
    soundManager.playSubtleTick();
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (currentUser?.id) {
      deleteTaskFromSupabase(taskId, currentUser.id);
    }
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

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `cal_${Date.now()}`,
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
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
      if (data.subjects) setSubjects(data.subjects);
      if (data.tasks) setTasks(data.tasks);
      if (data.mockTests) setMockTests(data.mockTests);
      if (data.milestones) setMilestones(data.milestones);
      if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
      if (data.settings) setSettings(data.settings);
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

  return (
    <StudyContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
        logout,
        switchUser,
        isDbConnected,
        isSyncingDb,
        dbSyncMessage,
        dbStats,
        syncSyllabusToDb,
        fetchSyllabusFromDb,
        subjects,
        tasks,
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
        deleteTask,
        updateTopicStatus,
        updateTopicConfidence,
        addMockTest,
        addCalendarEvent,
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
