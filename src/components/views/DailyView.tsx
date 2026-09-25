import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Timer,
  BookOpen,
  Save,
  Check,
  Edit3
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { TaskType, SubjectId, Task } from '../../types';
import { AddTaskModal } from '../modals/AddTaskModal';

interface DailyViewProps {
  onOpenAddTask: () => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ onOpenAddTask }) => {
  const {
    tasks,
    subjects,
    currentUser,
    toggleTaskCompletion,
    deleteTask,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerMode,
    setTimerSubject,
    addStudySessionHours,
  } = useStudy();

  const userId = currentUser?.id || 'demo_user';
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Daily reflection notes - user scoped to prevent cross-account leakage
  const [dailyNotes, setDailyNotes] = useState<string>(() => {
    return localStorage.getItem(`gate_notes_${userId}_${selectedDate}`) || '';
  });
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`gate_notes_${userId}_${selectedDate}`);
    if (saved !== null) {
      setDailyNotes(saved);
    } else {
      setDailyNotes('');
    }
  }, [selectedDate, userId]);

  const handleSaveNotes = () => {
    localStorage.setItem(`gate_notes_${userId}_${selectedDate}`, dailyNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesDate = !t.date || t.date === selectedDate;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesDate && matchesType;
  });

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const totalMins = filteredTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const completedMins = filteredTasks.filter((t) => t.completed).reduce((acc, t) => acc + t.durationMinutes, 0);

  // Time format for timer
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Navigate date
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Structured time blocks
  const timeBlocks = [
    {
      time: '06:30 - 09:00',
      period: 'Morning Math Rigor',
      subject: 'Linear Algebra & Probability',
      activity: 'Deep proof derivations, Sheldon Ross chapter problems',
      color: 'border-l-indigo-600 bg-indigo-50/30',
    },
    {
      time: '11:00 - 13:00',
      period: 'CS Core & Algorithms',
      subject: 'Data Structures / DBMS',
      activity: 'Balanced trees, Graph shortest paths, BCNF decomposition proofs',
      color: 'border-l-amber-500 bg-amber-50/30',
    },
    {
      time: '14:30 - 17:00',
      period: 'Afternoon Problem Solving',
      subject: 'GATE DA PYQ Drills',
      activity: 'Timed 30-question CBT set with virtual calculator accuracy check',
      color: 'border-l-emerald-600 bg-emerald-50/30',
    },
    {
      time: '20:00 - 22:00',
      period: 'Evening Spaced Retrieval',
      subject: 'Formula Vault & Flashcards',
      activity: 'Active recall testing on critical traps and machine learning cost gradients',
      color: 'border-l-purple-600 bg-purple-50/30',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Date Header & Day Navigator */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustDate(-1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono">
            {selectedDate}
          </div>

          <button
            onClick={() => adjustDate(1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Day Target Progress Ring/Summary */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-400">Target Time:</span>{' '}
            <span className="font-bold text-slate-800">
              {(completedMins / 60).toFixed(1)} / {(totalMins / 60).toFixed(1)} hrs
            </span>
          </div>
          <div className="text-right border-l border-slate-200 pl-4">
            <span className="text-slate-400">Tasks:</span>{' '}
            <span className="font-bold text-indigo-700">
              {completedCount}/{filteredTasks.length} Done
            </span>
          </div>
        </div>
      </section>

      {/* Main Split: Focus Pomodoro Station (Left) & Task Checklist (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pomodoro Focus Engine (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Deep Work Focus Engine
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {timerState.mode === 'focus' ? 'Active Focus' : 'Break'}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTimerMode('focus')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                timerState.mode === 'focus'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              25m Focus
            </button>
            <button
              onClick={() => setTimerMode('short_break')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                timerState.mode === 'short_break'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5m Break
            </button>
            <button
              onClick={() => setTimerMode('long_break')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                timerState.mode === 'long_break'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15m Break
            </button>
          </div>

          {/* Large Countdown Display */}
          <div className="py-6 text-center bg-slate-900 rounded-xl text-white shadow-inner space-y-1">
            <div className="text-5xl font-extrabold font-mono tracking-tight text-emerald-300">
              {formatTimer(timerState.timeLeft)}
            </div>
            <div className="text-xs text-slate-400 truncate px-4">
              {timerState.topicTitle}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3">
            {timerState.isRunning ? (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Session</span>
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Focus</span>
              </button>
            )}

            <button
              onClick={resetTimer}
              title="Reset Timer"
              className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Target Subject Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">
              Active Focus Subject & Topic
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={timerState.subjectId}
                onChange={(e) => {
                  const subId = e.target.value as SubjectId;
                  const s = subjects.find((sub) => sub.id === subId);
                  setTimerSubject(subId, s?.topics[0]?.title || 'General Deep Study');
                }}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-hidden bg-white truncate"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={timerState.topicTitle}
                onChange={(e) => setTimerSubject(timerState.subjectId, e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-hidden bg-white truncate"
              >
                {subjects
                  .find((s) => s.id === timerState.subjectId)
                  ?.topics.map((t) => (
                    <option key={t.id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Task Checklist & Daily Filters (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Study Checklist</h2>
              <p className="text-[11px] text-slate-500">
                Actionable units mapped to GATE DA high-yield marks
              </p>
            </div>
            <button
              onClick={onOpenAddTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>

          {/* Activity Category Filter Segmented Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'concept', label: 'Theory' },
              { id: 'textbook', label: 'Textbook' },
              { id: 'pyq', label: 'PYQ Drill' },
              { id: 'revision', label: 'Revision' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No tasks logged for {selectedDate}. Click "Add Target" to schedule.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 group ${
                    task.completed
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug truncate ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-indigo-700 truncate">
                          {task.topicTitle}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">
                          {task.scheduledTime || 'Flexible'}
                        </span>
                        {task.priority === 'urgent' && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-rose-600">Urgent</span>
                          </>
                        )}
                      </div>

                      {task.notes && (
                        <p className="mt-1.5 text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {task.durationMinutes}m
                    </span>
                    <button
                      onClick={() => {
                        setTaskToEdit(task);
                        setIsEditModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Time-Blocked Academic Schedule & Daily Notes */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Time-Blocked Routine Matrix (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Optimal Time-Blocked Routine (GATE DA Protocol)
            </h3>
            <p className="text-[11px] text-slate-500">
              Synchronized with IISc / IIT examination cognitive peak windows
            </p>
          </div>

          <div className="space-y-2.5">
            {timeBlocks.map((block, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 border border-slate-200/80 ${block.color} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className="font-mono text-slate-500">{block.time}</span>
                    <span>·</span>
                    <span>{block.period}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {block.activity}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-100 self-start sm:self-center shrink-0">
                  {block.subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Academic Journal & Realizations (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">
                Daily Study Notes & Doubts
              </h3>
              {notesSaved && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Log theorems verified, calculation traps noted, and questions for clarification.
            </p>
            <textarea
              rows={6}
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value)}
              placeholder="e.g. In Logistic regression, loss function is convex so gradient descent always reaches global minimum..."
              className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:border-indigo-600 outline-hidden font-mono leading-relaxed resize-none bg-[#faf8ff]"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Study Notes</span>
            </button>
          </div>
        </div>
      </section>

      {/* Edit Task Modal */}
      <AddTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
