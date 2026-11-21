import { Subject, Task, MockTest, Milestone, CalendarEvent, UserSettings, SprintPlan } from '../types';

export const INITIAL_SETTINGS: UserSettings = {
  targetAir: 1,
  targetYear: 2028,
  examDate: '2028-02-13',
  dailyGoalHours: 4.5,
  weeklyGoalHours: 28,
  streakCount: 0,
  userName: 'Aspirant',
  targetCollege: '',
  shareProgressWithCohort: false,
};

export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_SPRINTS: SprintPlan[] = [];
export const INITIAL_MOCK_TESTS: MockTest[] = [];
export const INITIAL_MILESTONES: Milestone[] = [];
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];

export const createFreshZeroSubjects = (): Subject[] => [];
