export type SubjectId = string;

export type TopicStatus = 'completed' | 'in_progress' | 'revision_due' | 'unvisited';
export type TaskType = 'concept' | 'textbook' | 'pyq' | 'revision' | 'test';
export type PriorityLevel = 'urgent' | 'high' | 'normal';
export type ResourceType = 'book_pdf' | 'video_tutorial';

export interface StudyResource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  authorOrChannel?: string;
  description?: string;
  subtopicTitle?: string;
  isStandardReference?: boolean;
  durationOrPages?: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  latex: string;
  plainText: string;
  explanation: string;
  tag: string;
}

export interface SubtopicItem {
  id: string;
  topicId: string;
  name: string;
  sortOrder: number;
}

export interface Topic {
  id: string;
  subjectId: SubjectId;
  title: string;
  subtopics: string[];
  subtopicItems?: SubtopicItem[];
  weightageTier: 'Critical (High)' | 'Core (Medium)' | 'Foundational';
  status: TopicStatus;
  confidenceScore: number; // 1 to 5
  lastRevised?: string;
  nextRevisionDue?: string;
  pyqsTotal: number;
  pyqsSolved: number;
  pyqAccuracy: number; // percentage
  formulas: FormulaItem[];
  commonTraps: string[];
  notes?: string;
  resources?: StudyResource[];
}

export interface Subject {
  id: SubjectId;
  name: string;
  shortCode: string;
  weightageMarks: string; // e.g. "16-18 Marks"
  approxQuestions: number;
  color: string;
  bgLight: string;
  borderColor: string;
  description: string;
  recommendedBooks: string[];
  topics: Topic[];
  resources?: StudyResource[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  subjectId: SubjectId;
  topicTitle: string;
  type: TaskType;
  durationMinutes: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. "07:00 AM"
  priority: PriorityLevel;
  notes?: string;
  status?: TaskStatus;
  sprintId?: string;
  sprintWeek?: string; // e.g. "2026-W40"
  storyPoints?: number; // 1, 2, 3, 5, 8
  orderIndex?: number;
}

export interface SprintRetrospective {
  completedAt: string;
  actualHours: number;
  targetHours: number;
  tasksCompleted: number;
  totalTasks: number;
  pointsCompleted: number;
  totalPoints: number;
  completionRate: number; // percentage
  whatWentWell: string;
  challengesFaced: string;
  actionItemsNextSprint: string;
  velocityRating: number; // 1 to 5 stars
}

export interface SprintPlan {
  id: string;
  name: string;
  weekNumber: number;
  year: number;
  weekIdentifier: string; // e.g. "2026-W40"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'planned';
  goal: string;
  targetHours: number;
  targetPoints: number;
  focusSubjectIds?: SubjectId[];
  retrospective?: SprintRetrospective;
  createdAt: string;
}

export interface StudyLog {
  id: string;
  date: string;
  subjectId: SubjectId;
  topicTitle: string;
  durationMinutes: number;
  pyqsSolved: number;
  pyqsCorrect: number;
  notes?: string;
}

export interface MockTest {
  id: string;
  title: string;
  testType: 'Full Length' | 'Subject Test' | 'Sectional Drill';
  subjectId?: SubjectId;
  date: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  percentile: number;
  timeTakenMinutes: number;
  totalTimeMinutes: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface Milestone {
  id: string;
  phaseNumber: number;
  phaseTitle: string;
  timeframe: string;
  targetMonth: string;
  topicsTarget: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  description: string;
  keyDeliverables: string[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'mock' | 'revision' | 'milestone' | 'study_block';
  subjectId?: SubjectId;
  time?: string;
  duration?: string;
  completed?: boolean;
}

export interface DbSubjectRow {
  id: string; // uuid
  name: string;
  code: string;
}

export interface DbTopicRow {
  id: string; // uuid
  name: string;
  subject_id: string; // uuid
}

export interface DbSubtopicRow {
  id: string; // uuid
  name: string;
  topic_id: string; // uuid
}

export interface StreakDayStatus {
  dateKey: string; // YYYY-MM-DD
  dayShort: string; // S, M, T, W, T, F, S
  isToday: boolean;
  active: boolean;
}

export interface StudyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  last7Days: StreakDayStatus[];
  activeDatesCount: number;
}

export interface UserSettings {
  targetAir: number;
  targetYear: number;
  examDate: string; // "2028-02-12"
  dailyGoalHours: number;
  weeklyGoalHours: number;
  streakCount: number;
  activeStudyDates?: string[]; // YYYY-MM-DD local dates with real study activity
  userName: string;
  targetCollege: string; // e.g. "IISc Bangalore (M.Tech AI) / IIT Bombay"
  shareProgressWithCohort?: boolean; // Privacy toggle for peer leaderboard
}

export interface LinkedAppletConfig {
  appletId: string;
  projectId: string;
  appletUrl: string;
  label: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  status: 'synced' | 'syncing' | 'error' | 'idle';
  statusMessage?: string;
  syncedStats?: {
    topicsCompleted: number;
    totalHours: number;
    pyqsSolved: number;
    tasksCount: number;
    mockTestsCount: number;
  };
}

export interface AppletSyncPayload {
  appletId: string;
  projectId?: string;
  sourceAppletUrl?: string;
  timestamp: string;
  user: AuthUser | null;
  syllabus: {
    totalTopics: number;
    completedTopics: number;
    syllabusPercent: number;
    subjects: Subject[];
  };
  studyData: {
    totalHoursStudied: number;
    totalPyqsSolved: number;
    overallPyqAccuracy: number;
    tasks: Task[];
    mockTests: MockTest[];
    settings: UserSettings;
    customResources?: Record<string, StudyResource[]>;
  };
}

export type UserRole = 'student' | 'content_manager' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
  targetAir: number;
  targetCollege: string;
  avatarUrl?: string;
  createdAt: string;
  isConfirmed?: boolean;
  isDemo?: boolean;
}

export interface SubjectProgressSummary {
  subjectId: SubjectId;
  subjectName: string;
  shortCode: string;
  completedTopics: number;
  totalTopics: number;
  completionPercent: number;
  pyqsSolved: number;
  pyqsTotal: number;
  pyqAccuracy: number;
  averageConfidence: number; // 1 to 5
}

export interface UserProgressProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  targetAir: number;
  targetCollege: string;
  targetYear: number;
  syllabusPercent: number;
  totalHoursStudied: number;
  totalPyqsSolved: number;
  totalPyqsOverall: number;
  overallPyqAccuracy: number;
  mockTestsTaken: number;
  mockAverageScore: number;
  studyStreakDays: number;
  coinBalance?: number;
  testsCreated?: number;
  lastActive: string;
  isCurrentUser?: boolean;
  subjects: SubjectProgressSummary[];
  fullSubjects?: Subject[];
}

// ============================================================================
// Hierarchical Notes & Test Management Types (Subject → Topic → Subtopic)
// ============================================================================
export type NoteEntityType = 'subject' | 'topic' | 'subtopic';
export type NoteType = 'complete' | 'short';
export type TestDifficulty = 'easy' | 'medium' | 'hard';
export type CorrectOptionKey = 'A' | 'B' | 'C' | 'D';

export interface StudyNote {
  id: string;
  ownerId?: string | null;
  entityType: NoteEntityType;
  entityId: string;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  noteType: NoteType;
  title: string;
  htmlContent: string;
  sanitizedVersion?: number;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOptionKey;
  explanation?: string;
  difficulty: TestDifficulty;
  questionImageUrl?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LevelTest {
  id: string;
  createdBy: string;
  creatorName?: string;
  entityType: NoteEntityType;
  entityId: string;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  title: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  isActive: boolean;
  questionCount?: number;
  questions?: TestQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  answers: Record<string, CorrectOptionKey>;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOptionKey;
  explanation: string;
  difficulty: TestDifficulty;
  questionImageUrl?: string;
  isValid: boolean;
  errors: string[];
}

export interface QuestionImportResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: ParsedQuestionRow[];
  fileError?: string;
}

export interface ManagedUserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

// ============================================================================
// Coin System & Competitive Leaderboard Types
// ============================================================================
export type CoinCategory =
  | 'test_created'
  | 'test_attempted'
  | 'accuracy_bonus'
  | 'improvement_bonus';

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  category: CoinCategory;
  reason: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface CoinAwardItem {
  category: CoinCategory;
  amount: number;
  reason: string;
}

export interface CoinAwardBreakdown {
  totalCoins: number;
  items: CoinAwardItem[];
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  role?: UserRole;
  coinBalance: number;
  testsCreated: number;
  testsAttempted: number;
  rank: number;
  isCurrentUser?: boolean;
}


