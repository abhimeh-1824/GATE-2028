import React, { useState, useMemo } from 'react';
import {
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Plus,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Flame,
  AlertCircle,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { SprintPlan, Task, TaskStatus } from '../../types';
import { soundManager } from '../../utils/audio';

export interface SprintPlannerProps {
  /** Optional custom sprint ID or week identifier. Defaults to context's selectedSprintWeek */
  sprintWeek?: string;
  /** Callback when user clicks to plan a new sprint */
  onOpenPlanModal?: () => void;
  /** Callback when user clicks to log sprint retrospective */
  onOpenRetroModal?: () => void;
  /** Callback when user clicks to add a task to this sprint */
  onAddTask?: (sprintWeek: string) => void;
  /** Compact mode toggle */
  compact?: boolean;
}

export const SprintPlanner: React.FC<SprintPlannerProps> = ({
  sprintWeek,
  onOpenPlanModal,
  onOpenRetroModal,
  onAddTask,
  compact = false,
}) => {
  const {
    sprints,
    selectedSprintWeek,
    setSelectedSprintWeek,
    tasks,
    updateSprint,
    createSprint,
    subjects,
  } = useStudy();

  // Active target sprint week
  const activeSprintWeek = sprintWeek || selectedSprintWeek;

  // Find the matching sprint object
  const currentSprint = useMemo(() => {
    if (activeSprintWeek === 'all' || activeSprintWeek === 'backlog') {
      return sprints.find((s) => s.status === 'active') || sprints[0] || null;
    }
    return sprints.find((s) => s.weekIdentifier === activeSprintWeek) || sprints[0] || null;
  }, [sprints, activeSprintWeek]);

  // Tasks belonging to this 1-week sprint
  const sprintTasks = useMemo(() => {
    if (!currentSprint) return [];
    return tasks.filter((t) => t.sprintWeek === currentSprint.weekIdentifier);
  }, [tasks, currentSprint]);

  // Quantitative completion rates and metrics
  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const completed = sprintTasks.filter((t) => t.completed || t.status === 'done').length;
    const inProgress = sprintTasks.filter((t) => t.status === 'in_progress').length;
    const inReview = sprintTasks.filter((t) => t.status === 'review').length;
    const todo = sprintTasks.filter((t) => !t.status || t.status === 'todo').length;

    const totalMinutes = sprintTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const completedMinutes = sprintTasks
      .filter((t) => t.completed || t.status === 'done')
      .reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

    const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 2), 0);
    const completedPoints = sprintTasks
      .filter((t) => t.completed || t.status === 'done')
      .reduce((acc, t) => acc + (t.storyPoints || 2), 0);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pointsRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    const targetHours = currentSprint?.targetHours || 28;
    const actualHours = Number((completedMinutes / 60).toFixed(1));
    const plannedHours = Number((totalMinutes / 60).toFixed(1));
    const hoursRate = targetHours > 0 ? Math.min(100, Math.round((actualHours / targetHours) * 100)) : 0;

    // Pace assessment
    let paceStatus: 'ahead' | 'on_track' | 'behind' | 'completed' = 'on_track';
    if (completionRate === 100) {
      paceStatus = 'completed';
    } else if (completionRate >= 60) {
      paceStatus = 'ahead';
    } else if (completionRate < 35 && total > 0) {
      paceStatus = 'behind';
    }

    return {
      total,
      completed,
      inProgress,
      inReview,
      todo,
      completionRate,
      pointsRate,
      totalPoints,
      completedPoints,
      actualHours,
      plannedHours,
      targetHours,
      hoursRate,
      paceStatus,
    };
  }, [sprintTasks, currentSprint]);

  // Inline Goal Editing State
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState(currentSprint?.goal || '');
  const [targetHoursInput, setTargetHoursInput] = useState(currentSprint?.targetHours || 28);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Sync state if sprint changes
  React.useEffect(() => {
    if (currentSprint) {
      setGoalText(currentSprint.goal || '');
      setTargetHoursInput(currentSprint.targetHours || 28);
    }
  }, [currentSprint]);

  const handleSaveGoal = () => {
    if (!currentSprint || !goalText.trim()) return;
    updateSprint(currentSprint.id, {
      goal: goalText.trim(),
      targetHours: Number(targetHoursInput) || 28,
    });
    setIsEditingGoal(false);
    soundManager.playSubtleTick();
  };

  const handleCancelGoal = () => {
    if (currentSprint) {
      setGoalText(currentSprint.goal || '');
      setTargetHoursInput(currentSprint.targetHours || 28);
    }
    setIsEditingGoal(false);
  };

  if (!currentSprint) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600 text-xs">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>No active 1-week sprint found. Define your weekly study milestone!</span>
        </div>
        {onOpenPlanModal && (
          <button
            onClick={onOpenPlanModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Plan 1-Week Sprint
          </button>
        )}
      </div>
    );
  }

  const isCompleted = currentSprint.status === 'completed';

  return (
    <div className="bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 border border-indigo-200 rounded-xl p-4 shadow-2xs transition-all">
      {/* Top Banner Header: Sprint Title, Dates, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-indigo-100/80 text-indigo-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>{currentSprint.weekIdentifier}</span>
          </div>

          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {currentSprint.name}
          </h2>

          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
              isCompleted
                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                : currentSprint.status === 'active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            {isCompleted ? 'Completed' : currentSprint.status === 'active' ? 'Active Sprint' : 'Planned'}
          </span>

          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            ({currentSprint.startDate} to {currentSprint.endDate})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditingGoal && (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 px-2 py-1 rounded hover:bg-white/80 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              title="Define or edit 1-week sprint goal"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Goal</span>
            </button>
          )}

          {onAddTask && (
            <button
              onClick={() => onAddTask(currentSprint.weekIdentifier)}
              className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer"
              title="Add a task to this sprint week"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Week</span>
            </button>
          )}

          {currentSprint.status === 'active' && onOpenRetroModal && (
            <button
              onClick={onOpenRetroModal}
              className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer"
              title="Finish sprint and log retro"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finish Sprint</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            title={isExpanded ? 'Collapse sprint metrics' : 'Expand sprint metrics'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 1-Week Goal Definition Section */}
      <div className="mt-3">
        {isEditingGoal ? (
          <div className="bg-white border border-indigo-200 rounded-lg p-3 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Define 1-Week Sprint Goal
              </label>
              <span className="text-[10px] text-slate-500 font-mono">1-week iteration focus</span>
            </div>

            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Define clear measurable objectives (e.g. Master Linear Algebra SVD, solve 35 PYQs, and score 80%+ on Mock 3)..."
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 leading-relaxed"
            />

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium">Target Study Hours:</label>
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={targetHoursInput}
                  onChange={(e) => setTargetHoursInput(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-center font-mono"
                />
                <span className="text-xs text-slate-500">hrs/week</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelGoal}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Goal</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 mr-1.5 flex-inline items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />
                1-Week Sprint Goal:
              </span>
              <span className="font-medium text-slate-800">{currentSprint.goal || 'No goal set yet for this sprint.'}</span>
            </div>

            {stats.paceStatus === 'completed' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <Award className="w-3 h-3 text-emerald-600" />
                Sprint Completed!
              </span>
            ) : stats.paceStatus === 'ahead' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
                <Flame className="w-3 h-3 text-indigo-600" />
                High Velocity ({stats.completionRate}%)
              </span>
            ) : stats.paceStatus === 'behind' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Push Required ({stats.completionRate}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                <TrendingUp className="w-3 h-3 text-slate-600" />
                On Track ({stats.completionRate}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar Component for Weekly Sprint */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Sprint Progress:</span>
            <span className="font-bold text-indigo-700 text-sm">{stats.completionRate}%</span>
            <span className="text-slate-500 text-[11px]">
              ({stats.completed}/{stats.total} tasks completed)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{stats.actualHours}h / {stats.targetHours}h study target</span>
            <span>{stats.completedPoints} / {stats.totalPoints} story pts</span>
          </div>
        </div>

        {/* The Progress Bar with Notch Markers */}
        <div className="relative w-full bg-slate-200/90 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1.5 ${
              stats.completionRate === 100
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(stats.completionRate > 0 ? 5 : 0, stats.completionRate))}%` }}
          >
            {stats.completionRate >= 15 && (
              <span className="text-[9px] font-mono font-bold text-white leading-none">
                {stats.completionRate}%
              </span>
            )}
          </div>

          {/* Notch Markers at 25%, 50%, 75% */}
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-2/4 w-px bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Expanded Metrics Breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-indigo-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-sans uppercase">To Do</span>
            <span className="text-sm font-bold text-slate-800">{stats.todo} tasks</span>
            <span className="text-[10px] text-slate-400 block font-sans">Queued for week</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-blue-200">
            <span className="text-blue-600 block text-[10px] font-sans uppercase">In Progress</span>
            <span className="text-sm font-bold text-blue-800">{stats.inProgress} tasks</span>
            <span className="text-[10px] text-slate-400 block font-sans">Active study</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
            <span className="text-amber-600 block text-[10px] font-sans uppercase">Review / PYQ</span>
            <span className="text-sm font-bold text-amber-800">{stats.inReview} tasks</span>
            <span className="text-[10px] text-slate-400 block font-sans">Practice & recall</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-emerald-600 block text-[10px] font-sans uppercase">Done & Mastered</span>
            <span className="text-sm font-bold text-emerald-800">{stats.completed} tasks</span>
            <span className="text-[10px] text-emerald-600 font-semibold block font-sans">
              {stats.pointsRate}% of story pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
