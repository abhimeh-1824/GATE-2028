import React, { useState, useMemo } from 'react';
import {
  Columns3,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  Star,
  Award,
  TrendingUp,
  BarChart2,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Check,
  X,
  FileText,
  Target,
  History,
  FolderPlus,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  Task,
  TaskStatus,
  TaskType,
  PriorityLevel,
  SubjectId,
  SprintPlan,
  SprintRetrospective,
} from '../../types';
import { soundManager } from '../../utils/audio';
import { SprintPlanner } from '../kanban/SprintPlanner';

const STATUS_COLUMNS: {
  id: TaskStatus;
  title: string;
  description: string;
  headerBg: string;
  headerBorder: string;
  headerTextColor: string;
  accentColor: string;
  dropBorder: string;
}[] = [
  {
    id: 'todo',
    title: 'To Do / Backlog',
    description: 'Queued for study this week',
    headerBg: 'bg-slate-50',
    headerBorder: 'border-slate-200',
    headerTextColor: 'text-slate-700',
    accentColor: 'border-l-slate-400',
    dropBorder: 'border-slate-400 bg-slate-50/50',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Currently studying & solving',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    headerTextColor: 'text-blue-800',
    accentColor: 'border-l-blue-500',
    dropBorder: 'border-blue-400 bg-blue-50/50',
  },
  {
    id: 'review',
    title: 'Review / PYQ Practice',
    description: 'Active recall & problem sets',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    headerTextColor: 'text-amber-800',
    accentColor: 'border-l-amber-500',
    dropBorder: 'border-amber-400 bg-amber-50/50',
  },
  {
    id: 'done',
    title: 'Done & Mastered',
    description: 'Completed this iteration',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    headerTextColor: 'text-emerald-800',
    accentColor: 'border-l-emerald-500',
    dropBorder: 'border-emerald-400 bg-emerald-50/50',
  },
];

const TASK_TYPE_LABELS: Record<TaskType, { label: string; bg: string; text: string }> = {
  concept: { label: 'Concept', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  pyq: { label: 'PYQ Drill', bg: 'bg-purple-50', text: 'text-purple-700' },
  revision: { label: 'Recall', bg: 'bg-amber-50', text: 'text-amber-700' },
  textbook: { label: 'Textbook', bg: 'bg-blue-50', text: 'text-blue-700' },
  test: { label: 'Drill Test', bg: 'bg-rose-50', text: 'text-rose-700' },
};

const PRIORITY_BADGES: Record<PriorityLevel, { label: string; text: string; dot: string }> = {
  urgent: { label: 'Urgent', text: 'text-rose-700', dot: 'bg-rose-500' },
  high: { label: 'High', text: 'text-amber-700', dot: 'bg-amber-500' },
  normal: { label: 'Normal', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const KanbanView: React.FC = () => {
  const {
    tasks,
    sprints,
    selectedSprintWeek,
    setSelectedSprintWeek,
    subjects,
    addTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    assignTaskToSprint,
    bulkAssignTasksToSprint,
    createSprint,
    updateSprint,
    completeSprint,
    currentUser,
  } = useStudy();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'board' | 'track_record' | 'backlog'>('board');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Modals state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isPlanSprintModalOpen, setIsPlanSprintModalOpen] = useState(false);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);

  // Backlog Multi-select
  const [selectedBacklogTaskIds, setSelectedBacklogTaskIds] = useState<string[]>([]);

  // Current selected sprint object
  const currentSprint = useMemo(() => {
    if (selectedSprintWeek === 'all' || selectedSprintWeek === 'backlog') {
      return null;
    }
    return sprints.find((s) => s.weekIdentifier === selectedSprintWeek) || null;
  }, [sprints, selectedSprintWeek]);

  // Active sprint for quick assignment
  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.status === 'active') || sprints[0] || null;
  }, [sprints]);

  // Filter tasks based on view mode, sprint week, and user search/filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Sprint week filtering
      if (selectedSprintWeek === 'backlog') {
        if (t.sprintWeek) return false;
      } else if (selectedSprintWeek !== 'all') {
        if (t.sprintWeek !== selectedSprintWeek) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesTopic = t.topicTitle.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesNotes) return false;
      }

      // 3. Subject filter
      if (selectedSubjectFilter !== 'all' && t.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // 4. Priority filter
      if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) {
        return false;
      }

      // 5. Type filter
      if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, selectedSprintWeek, searchQuery, selectedSubjectFilter, selectedPriorityFilter, selectedTypeFilter]);

  // Tasks grouped by status
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    for (const t of filteredTasks) {
      const status: TaskStatus = t.status || (t.completed ? 'done' : 'todo');
      map[status].push(t);
    }

    return map;
  }, [filteredTasks]);

  // Existing unassigned backlog tasks
  const unassignedTasks = useMemo(() => {
    return tasks.filter((t) => !t.sprintWeek);
  }, [tasks]);

  // Current Sprint metrics
  const sprintStats = useMemo(() => {
    const sprintTasks = currentSprint
      ? tasks.filter((t) => t.sprintWeek === currentSprint.weekIdentifier)
      : filteredTasks;

    const total = sprintTasks.length;
    const completed = sprintTasks.filter((t) => t.completed || t.status === 'done').length;
    const totalMinutes = sprintTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const completedMinutes = sprintTasks
      .filter((t) => t.completed || t.status === 'done')
      .reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 2), 0);
    const completedPoints = sprintTasks
      .filter((t) => t.completed || t.status === 'done')
      .reduce((acc, t) => acc + (t.storyPoints || 2), 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      percent,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      completedHours: Number((completedMinutes / 60).toFixed(1)),
      totalPoints,
      completedPoints,
    };
  }, [currentSprint, tasks, filteredTasks]);

  // Track Record Historical Aggregates
  const trackRecordSummary = useMemo(() => {
    const completedSprints = sprints.filter((s) => s.status === 'completed' || s.retrospective);
    const totalCompletedSprints = completedSprints.length;

    let totalTasksDone = 0;
    let totalTargetHours = 0;
    let totalActualHours = 0;
    let totalPointsDone = 0;
    let avgCompletionRate = 0;

    for (const s of completedSprints) {
      if (s.retrospective) {
        totalTasksDone += s.retrospective.tasksCompleted || 0;
        totalTargetHours += s.retrospective.targetHours || s.targetHours || 0;
        totalActualHours += s.retrospective.actualHours || 0;
        totalPointsDone += s.retrospective.pointsCompleted || 0;
        avgCompletionRate += s.retrospective.completionRate || 0;
      } else {
        const sTasks = tasks.filter((t) => t.sprintWeek === s.weekIdentifier);
        const done = sTasks.filter((t) => t.completed).length;
        totalTasksDone += done;
        totalTargetHours += s.targetHours;
        totalActualHours += (sTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) / 60);
      }
    }

    const avgRate = totalCompletedSprints > 0 ? Math.round(avgCompletionRate / totalCompletedSprints) : 95;
    const avgVelocityTasks = totalCompletedSprints > 0 ? (totalTasksDone / totalCompletedSprints).toFixed(1) : '7.0';
    const avgHoursPerWeek = totalCompletedSprints > 0 ? (totalActualHours / totalCompletedSprints).toFixed(1) : '27.5';

    return {
      totalCompletedSprints,
      avgRate,
      avgVelocityTasks,
      avgHoursPerWeek,
      totalTasksDone,
      totalActualHours: totalActualHours.toFixed(1),
    };
  }, [sprints, tasks]);

  // Subject helper map
  const subjectMap = useMemo(() => {
    const map = new Map<SubjectId, { name: string; color: string; shortCode: string }>();
    for (const s of subjects) {
      map.set(s.id, { name: s.name, color: s.color, shortCode: s.shortCode });
    }
    return map;
  }, [subjects]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Move task to next or previous column
  const handleStepStatus = (taskId: string, currentStatus: TaskStatus, direction: 'prev' | 'next') => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const idx = statuses.indexOf(currentStatus);
    if (idx === -1) return;
    const newIdx = direction === 'next' ? Math.min(statuses.length - 1, idx + 1) : Math.max(0, idx - 1);
    if (newIdx !== idx) {
      moveTaskStatus(taskId, statuses[newIdx]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 mb-1">
            <Columns3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>AGILE EXECUTION</span>
            <span aria-hidden="true">·</span>
            <span>1-WEEK SPRINTS</span>
            <span aria-hidden="true">·</span>
            <span>STUDY KANBAN</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Kanban Board & Sprint Planner
            {currentSprint && (
              <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
                currentSprint.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentSprint.status === 'completed'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {currentSprint.status === 'active' ? 'Active Sprint' : currentSprint.status}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Plan 1-week focused milestones, move tasks dynamically across workflow stages, and review your historical track record.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setQuickAddColumn('todo');
              setEditingTask(null);
              setIsCreateTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => setIsPlanSprintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plan 1-Week Sprint</span>
          </button>

          {currentSprint && currentSprint.status === 'active' && (
            <button
              onClick={() => setIsRetroModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Sprint & Log Retro</span>
            </button>
          )}
        </div>
      </div>

      {/* Top SprintPlanner: Displays Active Weekly Goal, Completion Rate, and Progress Bar */}
      <SprintPlanner
        sprintWeek={selectedSprintWeek !== 'all' && selectedSprintWeek !== 'backlog' ? selectedSprintWeek : undefined}
        onOpenPlanModal={() => setIsPlanSprintModalOpen(true)}
        onOpenRetroModal={() => setIsRetroModalOpen(true)}
        onAddTask={(week) => {
          setQuickAddColumn('todo');
          setEditingTask(null);
          setIsCreateTaskModalOpen(true);
        }}
      />

      {/* Week Selector Bar ("show every week in kanban board") */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
              <Calendar className="w-3.5 h-3.5" /> Week:
            </span>

            {/* All Tasks view */}
            <button
              onClick={() => setSelectedSprintWeek('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                selectedSprintWeek === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Tasks ({tasks.length})
            </button>

            {/* Backlog unassigned */}
            <button
              onClick={() => setSelectedSprintWeek('backlog')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                selectedSprintWeek === 'backlog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Backlog ({unassignedTasks.length})
            </button>

            {/* Weekly Sprints */}
            {sprints.map((sprint) => {
              const sprintTasks = tasks.filter((t) => t.sprintWeek === sprint.weekIdentifier);
              const isSelected = selectedSprintWeek === sprint.weekIdentifier;
              return (
                <button
                  key={sprint.id}
                  onClick={() => setSelectedSprintWeek(sprint.weekIdentifier)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : sprint.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : sprint.status === 'completed'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{sprint.weekIdentifier}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected
                      ? 'bg-indigo-700 text-indigo-100'
                      : sprint.status === 'active'
                      ? 'bg-emerald-200 text-emerald-900 font-bold'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {sprintTasks.length}
                  </span>
                  {sprint.status === 'active' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-view switcher: Board, Track Record, Backlog Planner */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setActiveTab('track_record')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'track_record'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Track Record</span>
            </button>

            <button
              onClick={() => setActiveTab('backlog')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'backlog'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sprint Backlog ({unassignedTasks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: KANBAN BOARD VIEW */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks by title, topic, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Subject Filter */}
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                aria-label="Filter tasks by subject"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortCode} - {s.name}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                aria-label="Filter tasks by priority"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>

              {/* Task Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                aria-label="Filter tasks by task type"
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="concept">Concept Study</option>
                <option value="pyq">PYQ Drills</option>
                <option value="revision">Spaced Recall</option>
                <option value="textbook">Textbook Reading</option>
                <option value="test">Mock & Drill</option>
              </select>

              {(selectedSubjectFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedTypeFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubjectFilter('all');
                    setSelectedPriorityFilter('all');
                    setSelectedTypeFilter('all');
                  }}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 KANBAN COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] || [];
              const totalColMinutes = colTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
              const totalColPoints = colTasks.reduce((acc, t) => acc + (t.storyPoints || 2), 0);
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`bg-white border rounded-xl flex flex-col transition-all duration-200 min-h-[550px] shadow-2xs ${
                    isOver ? `${col.dropBorder} border-2 border-dashed` : 'border-slate-200'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b ${col.headerBorder} ${col.headerBg} rounded-t-xl`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-emerald-500' : col.id === 'in_progress' ? 'bg-blue-500' : col.id === 'review' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <h2 className={`font-semibold text-xs uppercase tracking-wider ${col.headerTextColor}`}>
                          {col.title}
                        </h2>
                        <span className="text-[11px] px-1.5 py-0.2 bg-white/80 font-mono font-bold rounded border border-slate-200 text-slate-700">
                          {colTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setQuickAddColumn(col.id);
                          setEditingTask(null);
                          setIsCreateTaskModalOpen(true);
                        }}
                        title={`Add task to ${col.title}`}
                        className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1 px-0.5">
                      <span>{Math.round(totalColMinutes / 60 * 10) / 10}h planned</span>
                      <span>{totalColPoints} story pts</span>
                    </div>
                  </div>

                  {/* Task Cards Container */}
                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[720px] scrollbar-thin">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center p-3">
                        <Columns3 className="w-5 h-5 mb-1 text-slate-300" />
                        <span>No tasks in {col.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Drag cards here or click +</span>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const subj = subjectMap.get(task.subjectId);
                        const typeInfo = TASK_TYPE_LABELS[task.type] || TASK_TYPE_LABELS.concept;
                        const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.normal;
                        const isDragging = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className={`group relative bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all hover:border-slate-300 border-l-4 ${col.accentColor} ${
                              isDragging ? 'opacity-40 scale-98' : 'opacity-100'
                            }`}
                          >
                            {/* Card Top: Subject & Type & Story Points */}
                            <div className="flex items-center justify-between gap-1.5 text-[11px] mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {subj && (
                                  <span
                                    className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded truncate"
                                    style={{
                                      backgroundColor: `${subj.color}15`,
                                      color: subj.color,
                                    }}
                                  >
                                    {subj.shortCode}
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                                  {typeInfo.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-slate-500">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                                  {task.storyPoints || 2} pts
                                </span>
                              </div>
                            </div>

                            {/* Title & Topic */}
                            <h3 className={`text-xs font-semibold leading-snug ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {task.topicTitle}
                            </p>

                            {/* Notes excerpt if any */}
                            {task.notes && (
                              <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded mt-2 line-clamp-2 border border-slate-100">
                                {task.notes}
                              </p>
                            )}

                            {/* Card Metadata Footer */}
                            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{task.durationMinutes}m</span>
                                </span>

                                <span className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                                  <span className={priorityInfo.text}>{priorityInfo.label}</span>
                                </span>
                              </div>

                              {task.sprintWeek && (
                                <span className="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-semibold text-[9px]">
                                  {task.sprintWeek}
                                </span>
                              )}
                            </div>

                            {/* Interactive Quick Mover & Actions ("movie to status accordinly") */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                              {/* Step Left */}
                              <button
                                onClick={() => handleStepStatus(task.id, col.id, 'prev')}
                                disabled={col.id === 'todo'}
                                title="Move to previous status"
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 rounded cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Direct Column Picker */}
                              <div className="flex items-center gap-1 text-[10px]">
                                <select
                                  value={task.status || (task.completed ? 'done' : 'todo')}
                                  onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                                  aria-label="Move task to status"
                                  className="text-[10px] py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="done">Done</option>
                                </select>
                              </div>

                              {/* Actions: Edit & Delete */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsCreateTaskModalOpen(true);
                                  }}
                                  title="Edit Task"
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  title="Delete Task"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {/* Step Right */}
                                <button
                                  onClick={() => handleStepStatus(task.id, col.id, 'next')}
                                  disabled={col.id === 'done'}
                                  title="Move to next status"
                                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 rounded cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRACK RECORD & VELOCITY ARCHIVE ("also have a track recored") */}
      {activeTab === 'track_record' && (
        <div className="space-y-6">
          {/* Aggregate KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                <span>COMPLETED SPRINTS</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {trackRecordSummary.totalCompletedSprints}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total 1-week iterations verified
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                <span>AVG SPRINT ACCURACY</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {trackRecordSummary.avgRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Commitment-to-delivery reliability
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                <span>WEEKLY VELOCITY</span>
                <BarChart2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-700 font-mono">
                {trackRecordSummary.avgVelocityTasks} <span className="text-sm font-normal text-slate-500">tasks/wk</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Average topics & drills mastered
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                <span>WEEKLY STUDY HOURS</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono">
                {trackRecordSummary.avgHoursPerWeek} <span className="text-sm font-normal text-slate-500">hrs/wk</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Logged deep study volume
              </div>
            </div>
          </div>

          {/* Visual Weekly Velocity Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sprint Delivery Velocity by Week</h3>
                <p className="text-xs text-slate-500">Comparison of planned study workload vs completed deliveries</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 bg-indigo-600 rounded-xs" /> Completed Tasks
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 bg-slate-200 rounded-xs" /> Planned Scope
                </span>
              </div>
            </div>

            {/* Simple Responsive Chart */}
            <div className="space-y-3 pt-2">
              {sprints.map((sprint) => {
                const sTasks = tasks.filter((t) => t.sprintWeek === sprint.weekIdentifier);
                const total = sprint.retrospective?.totalTasks || sTasks.length || 6;
                const done = sprint.retrospective?.tasksCompleted || sTasks.filter((t) => t.completed).length;
                const percent = Math.round((done / Math.max(1, total)) * 100);

                return (
                  <div key={sprint.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        {sprint.weekIdentifier}
                        <span className="font-normal text-slate-500 text-[11px]">({sprint.startDate} - {sprint.endDate})</span>
                      </span>
                      <span className="text-slate-600">
                        {done}/{total} tasks ({percent}%) · {sprint.retrospective?.actualHours || sprintStats.completedHours}h
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-3 rounded-l-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Historical Sprint Record Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Historical Iteration Log & Retrospectives</span>
            </h3>

            {sprints.map((sprint) => {
              const sprintTasks = tasks.filter((t) => t.sprintWeek === sprint.weekIdentifier);
              const isCompleted = sprint.status === 'completed' || !!sprint.retrospective;
              const retro = sprint.retrospective;

              return (
                <div
                  key={sprint.id}
                  className={`bg-white border rounded-xl p-5 shadow-2xs space-y-4 transition-all ${
                    isCompleted ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500">
                        <span className="font-bold text-slate-900">{sprint.weekIdentifier}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sprint.startDate} to {sprint.endDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold uppercase text-[10px] ${
                          sprint.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : sprint.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {sprint.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{sprint.name}</h4>
                    </div>

                    {retro && (
                      <div className="flex items-center gap-1 text-amber-500 font-mono text-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < (retro.velocityRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Goal */}
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Sprint Goal:</span> {sprint.goal}
                  </div>

                  {/* Quantitative Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Scope Delivery</span>
                      <span className="font-bold text-slate-900">
                        {retro ? `${retro.tasksCompleted}/${retro.totalTasks}` : `${sprintTasks.filter((t) => t.completed).length}/${sprintTasks.length}`} tasks
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Completion Rate</span>
                      <span className="font-bold text-emerald-700">
                        {retro ? `${retro.completionRate}%` : `${sprintStats.percent}%`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Study Hours</span>
                      <span className="font-bold text-slate-900">
                        {retro ? `${retro.actualHours}h` : `${sprintStats.completedHours}h`} / {sprint.targetHours}h
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Story Points</span>
                      <span className="font-bold text-indigo-700">
                        {retro ? `${retro.pointsCompleted} pts` : `${sprintStats.completedPoints} pts`}
                      </span>
                    </div>
                  </div>

                  {/* Retrospective Notes if available */}
                  {retro && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900 block mb-1 text-[11px]">What Went Well</span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{retro.whatWentWell}</p>
                      </div>

                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-900 block mb-1 text-[11px]">Challenges Faced</span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{retro.challengesFaced}</p>
                      </div>

                      <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                        <span className="font-bold text-indigo-900 block mb-1 text-[11px]">Next Sprint Action Items</span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{retro.actionItemsNextSprint}</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Action to Complete Sprint if Active */}
                  {sprint.status === 'active' && !retro && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setSelectedSprintWeek(sprint.weekIdentifier);
                          setIsRetroModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Log Retrospective & Archive Sprint</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SPRINT BACKLOG & EXISTING TASKS PLANNER ("add this if we have exiting task create") */}
      {activeTab === 'backlog' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sprint Backlog & Existing Unassigned Tasks</h3>
                <p className="text-xs text-slate-500">
                  Select existing tasks from your syllabus to pull into your active 1-week sprint iteration.
                </p>
              </div>

              {activeSprint && selectedBacklogTaskIds.length > 0 && (
                <button
                  onClick={() => {
                    bulkAssignTasksToSprint(selectedBacklogTaskIds, activeSprint.id, activeSprint.weekIdentifier);
                    setSelectedBacklogTaskIds([]);
                    soundManager.playCompletionChime();
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign {selectedBacklogTaskIds.length} Tasks to {activeSprint.weekIdentifier}</span>
                </button>
              )}
            </div>
          </div>

          {unassignedTasks.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800">All Tasks Assigned!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Every task in your study roadmap currently belongs to a weekly sprint iteration. You can create new tasks directly using the button below.
              </p>
              <button
                onClick={() => {
                  setQuickAddColumn('todo');
                  setEditingTask(null);
                  setIsCreateTaskModalOpen(true);
                }}
                className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBacklogTaskIds.length === unassignedTasks.length && unassignedTasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBacklogTaskIds(unassignedTasks.map((t) => t.id));
                      } else {
                        setSelectedBacklogTaskIds([]);
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Select All ({unassignedTasks.length} unassigned)</span>
                </div>

                <span>Quick Actions</span>
              </div>

              <div className="divide-y divide-slate-100">
                {unassignedTasks.map((task) => {
                  const subj = subjectMap.get(task.subjectId);
                  const isChecked = selectedBacklogTaskIds.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBacklogTaskIds((prev) => [...prev, task.id]);
                            } else {
                              setSelectedBacklogTaskIds((prev) => prev.filter((id) => id !== task.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            {subj && (
                              <span
                                className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${subj.color}15`, color: subj.color }}
                              >
                                {subj.shortCode}
                              </span>
                            )}
                            <h4 className="font-semibold text-slate-900 truncate">{task.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{task.topicTitle} · {task.durationMinutes} mins · {task.priority} priority</p>
                        </div>
                      </div>

                      {/* Assign button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {activeSprint && (
                          <button
                            onClick={() => {
                              assignTaskToSprint(task.id, activeSprint.id, activeSprint.weekIdentifier);
                              soundManager.playCompletionChime();
                            }}
                            className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold cursor-pointer"
                          >
                            + Move to {activeSprint.weekIdentifier}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT TASK MODAL */}
      {isCreateTaskModalOpen && (
        <CreateEditTaskModal
          isOpen={isCreateTaskModalOpen}
          initialColumn={quickAddColumn || 'todo'}
          editingTask={editingTask}
          onClose={() => {
            setIsCreateTaskModalOpen(false);
            setEditingTask(null);
            setQuickAddColumn(null);
          }}
        />
      )}

      {/* MODAL 2: PLAN 1-WEEK SPRINT MODAL */}
      {isPlanSprintModalOpen && (
        <PlanSprintModal
          isOpen={isPlanSprintModalOpen}
          onClose={() => setIsPlanSprintModalOpen(false)}
        />
      )}

      {/* MODAL 3: COMPLETE SPRINT & RETROSPECTIVE MODAL */}
      {isRetroModalOpen && currentSprint && (
        <SprintRetroModal
          isOpen={isRetroModalOpen}
          sprint={currentSprint}
          stats={sprintStats}
          onClose={() => setIsRetroModalOpen(false)}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-MODALS
// ==========================================

interface CreateEditTaskModalProps {
  isOpen: boolean;
  initialColumn: TaskStatus;
  editingTask: Task | null;
  onClose: () => void;
}

const CreateEditTaskModal: React.FC<CreateEditTaskModalProps> = ({
  isOpen,
  initialColumn,
  editingTask,
  onClose,
}) => {
  const { subjects, sprints, selectedSprintWeek, addTask, updateTask } = useStudy();

  const [title, setTitle] = useState(editingTask?.title || '');
  const [subjectId, setSubjectId] = useState<SubjectId>(editingTask?.subjectId || 'linear_algebra');
  const [topicTitle, setTopicTitle] = useState(editingTask?.topicTitle || '');
  const [taskType, setTaskType] = useState<TaskType>(editingTask?.type || 'pyq');
  const [durationMinutes, setDurationMinutes] = useState<number>(editingTask?.durationMinutes || 45);
  const [priority, setPriority] = useState<PriorityLevel>(editingTask?.priority || 'high');
  const [status, setStatus] = useState<TaskStatus>(editingTask?.status || initialColumn);
  const [sprintWeek, setSprintWeek] = useState<string>(
    editingTask?.sprintWeek || (selectedSprintWeek !== 'all' && selectedSprintWeek !== 'backlog' ? selectedSprintWeek : '2026-W40')
  );
  const [storyPoints, setStoryPoints] = useState<number>(editingTask?.storyPoints || 3);
  const [scheduledTime, setScheduledTime] = useState(editingTask?.scheduledTime || '09:00 AM');
  const [notes, setNotes] = useState(editingTask?.notes || '');

  // Topics for selected subject
  const currentSubjectTopics = useMemo(() => {
    const s = subjects.find((subj) => subj.id === subjectId);
    return s ? s.topics : [];
  }, [subjects, subjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedSprint = sprints.find((s) => s.weekIdentifier === sprintWeek);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        subjectId,
        topicTitle: topicTitle || (currentSubjectTopics[0]?.title || 'Core Topic'),
        type: taskType,
        durationMinutes: Number(durationMinutes),
        priority,
        status,
        completed: status === 'done',
        sprintWeek: sprintWeek === 'none' ? undefined : sprintWeek,
        sprintId: matchedSprint?.id,
        storyPoints: Number(storyPoints),
        scheduledTime,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        subjectId,
        topicTitle: topicTitle || (currentSubjectTopics[0]?.title || 'Core Topic'),
        type: taskType,
        durationMinutes: Number(durationMinutes),
        priority,
        status,
        completed: status === 'done',
        sprintWeek: sprintWeek === 'none' ? undefined : sprintWeek,
        sprintId: matchedSprint?.id,
        storyPoints: Number(storyPoints),
        scheduledTime,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Columns3 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Solve 20 Bayes Theorem & Total Probability PYQs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const sId = e.target.value as SubjectId;
                  setSubjectId(sId);
                  const subj = subjects.find((s) => s.id === sId);
                  if (subj && subj.topics.length > 0) {
                    setTopicTitle(subj.topics[0].title);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortCode} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
              <select
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                {currentSubjectTopics.map((top) => (
                  <option key={top.id} value={top.title}>
                    {top.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Sprint Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kanban Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todo">To Do / Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review / PYQ Practice</option>
                <option value="done">Completed / Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">1-Week Sprint Week</label>
              <select
                value={sprintWeek}
                onChange={(e) => setSprintWeek(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="none">Unassigned (Backlog)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.weekIdentifier}>
                    {s.weekIdentifier} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="concept">Concept Study</option>
                <option value="pyq">PYQ Drill</option>
                <option value="revision">Spaced Recall</option>
                <option value="textbook">Textbook Chapter</option>
                <option value="test">Subject / Drill Test</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          {/* Duration & Story Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                max="300"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Story Points (Effort)</label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value={1}>1 pt (Quick &lt; 30m)</option>
                <option value={2}>2 pts (Standard 45m)</option>
                <option value={3}>3 pts (Deep 60-90m)</option>
                <option value={5}>5 pts (Intensive 2+ hrs)</option>
                <option value={8}>8 pts (Full Mock / Milestone)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Key Objectives & Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Focus on memoryless property proofs and conditioning trick..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PlanSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlanSprintModal: React.FC<PlanSprintModalProps> = ({ isOpen, onClose }) => {
  const { createSprint, tasks, bulkAssignTasksToSprint } = useStudy();

  const [name, setName] = useState('Sprint 42: Advanced Algorithms & Statistical Tests');
  const [weekIdentifier, setWeekIdentifier] = useState('2026-W42');
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-18');
  const [goal, setGoal] = useState('Master Dynamic Programming, Hypothesis Testing Chi-Sq, and B+ Tree indexing.');
  const [targetHours, setTargetHours] = useState(28);
  const [targetPoints, setTargetPoints] = useState(20);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const unassigned = useMemo(() => tasks.filter((t) => !t.sprintWeek), [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !weekIdentifier.trim()) return;

    createSprint({
      name: name.trim(),
      weekIdentifier: weekIdentifier.trim(),
      weekNumber: parseInt(weekIdentifier.replace(/[^0-9]/g, '').slice(4), 10) || 42,
      year: 2026,
      startDate,
      endDate,
      status: 'active',
      goal: goal.trim(),
      targetHours: Number(targetHours),
      targetPoints: Number(targetPoints),
    });

    if (selectedTaskIds.length > 0) {
      bulkAssignTasksToSprint(selectedTaskIds, null, weekIdentifier.trim());
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Plan 1-Week Study Sprint</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sprint Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Week ID</label>
              <input
                type="text"
                required
                value={weekIdentifier}
                onChange={(e) => setWeekIdentifier(e.target.value)}
                placeholder="2026-W42"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start (Mon)</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End (Sun)</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Overarching Sprint Goal</label>
            <textarea
              rows={2}
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hours (1 Week)</label>
              <input
                type="number"
                min="5"
                max="80"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Story Points</label>
              <input
                type="number"
                min="5"
                max="100"
                value={targetPoints}
                onChange={(e) => setTargetPoints(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Select Existing Tasks to include */}
          {unassigned.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Include Existing Unassigned Tasks ({unassigned.length} available)
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                {unassigned.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 hover:bg-white rounded">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTaskIds((prev) => [...prev, t.id]);
                        } else {
                          setSelectedTaskIds((prev) => prev.filter((id) => id !== t.id));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">{t.title} ({t.durationMinutes}m)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Launch Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SprintRetroModalProps {
  isOpen: boolean;
  sprint: SprintPlan;
  stats: {
    total: number;
    completed: number;
    percent: number;
    completedHours: number;
    completedPoints: number;
    totalPoints: number;
  };
  onClose: () => void;
}

const SprintRetroModal: React.FC<SprintRetroModalProps> = ({
  isOpen,
  sprint,
  stats,
  onClose,
}) => {
  const { completeSprint } = useStudy();

  const [whatWentWell, setWhatWentWell] = useState(
    'Strong adherence to daily morning problem solving blocks. Finished all key PYQ drills with high accuracy.'
  );
  const [challengesFaced, setChallengesFaced] = useState(
    'Complex multi-variable optimization derivations took 45 minutes longer than estimated.'
  );
  const [actionItems, setActionItems] = useState(
    'Pre-compute step-by-step matrix templates before solving numerical drill sheets next week.'
  );
  const [rating, setRating] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const retro: SprintRetrospective = {
      completedAt: new Date().toISOString(),
      actualHours: stats.completedHours,
      targetHours: sprint.targetHours,
      tasksCompleted: stats.completed,
      totalTasks: stats.total,
      pointsCompleted: stats.completedPoints,
      totalPoints: stats.totalPoints,
      completionRate: stats.percent,
      whatWentWell: whatWentWell.trim(),
      challengesFaced: challengesFaced.trim(),
      actionItemsNextSprint: actionItems.trim(),
      velocityRating: rating,
    };

    completeSprint(sprint.id, retro);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Complete Sprint & Log Track Record</h3>
              <p className="text-[11px] text-slate-500">{sprint.weekIdentifier} ({sprint.name})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Stats Summary */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Delivered</span>
              <span className="text-sm font-bold text-slate-900">{stats.completed}/{stats.total} tasks</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Accuracy</span>
              <span className="text-sm font-bold text-emerald-700">{stats.percent}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Hours Studied</span>
              <span className="text-sm font-bold text-indigo-700">{stats.completedHours}h</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">1. What Went Well?</label>
            <textarea
              rows={2}
              required
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">2. Key Challenges or Blockers Faced?</label>
            <textarea
              rows={2}
              required
              value={challengesFaced}
              onChange={(e) => setChallengesFaced(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">3. Action Items for Next 1-Week Sprint</label>
            <textarea
              rows={2}
              required
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Iteration Velocity Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-slate-600 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Archive & Save to Track Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
