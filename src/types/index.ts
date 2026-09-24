export type SubjectId =
  | 'prob_stat'
  | 'linear_algebra'
  | 'calculus_opt'
  | 'dsa_python'
  | 'dbms_warehouse'
  | 'machine_learning'
  | 'artificial_intel'
  | 'general_aptitude'
  | 'mock_pyq';

export type TopicStatus = 'completed' | 'in_progress' | 'revision_due' | 'unvisited';
export type TaskType = 'concept' | 'textbook' | 'pyq' | 'revision' | 'test';
export type PriorityLevel = 'urgent' | 'high' | 'normal';

export interface FormulaItem {
  id: string;
  title: string;
  latex: string;
  plainText: string;
  explanation: string;
  tag: string;
}

export interface Topic {
  id: string;
  subjectId: SubjectId;
  title: string;
  subtopics: string[];
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
}

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

export interface UserSettings {
  targetAir: number;
  targetYear: number;
  examDate: string; // "2028-02-12"
  dailyGoalHours: number;
  weeklyGoalHours: number;
  streakCount: number;
  userName: string;
  targetCollege: string; // e.g. "IISc Bangalore (M.Tech AI) / IIT Bombay"
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  targetAir: number;
  targetCollege: string;
  avatarUrl?: string;
  createdAt: string;
  isConfirmed?: boolean;
}
