import React from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  AlertTriangle,
  Play,
  RotateCcw,
  Sigma,
  Calendar,
  ChevronRight,
  Users
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundManager } from '../../utils/audio';
import { NeedsRevisionWidget } from '../widgets/NeedsRevisionWidget';

interface DashboardViewProps {
  onOpenFormulaVault: () => void;
  onOpenAddTask: () => void;
  onSelectSubject?: (subjectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenFormulaVault,
  onOpenAddTask,
  onSelectSubject,
}) => {
  const {
    subjects,
    tasks,
    mockTests,
    settings,
    totalTopics,
    completedTopics,
    syllabusPercent,
    totalHoursStudied,
    totalPyqsSolved,
    overallPyqAccuracy,
    daysRemaining,
    revisionDueCount,
    toggleTaskCompletion,
    setActiveView,
    startTimer,
    timerState,
  } = useStudy();

  const todayTasks = tasks.slice(0, 5);
  const latestMock = mockTests[mockTests.length - 1];

  // Formula of the day
  const formulaOfTheDay = {
    title: 'Bayes Theorem & Total Probability',
    latex: 'P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{\\sum_{i} P(B \\mid A_i) P(A_i)}',
    subject: 'Probability and Statistics',
    trap: 'Never confuse P(B|A) (sensitivity) with P(A|B) (posterior precision).',
  };

  // Find topics due for revision
  const revisionDueTopics = subjects
    .flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name, subjectId: s.id })))
    .filter((t) => t.status === 'revision_due')
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Target Hero Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-linear-to-l from-indigo-50/60 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>GATE DA 2028 MASTER CAMPAIGN</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">AIR {settings.targetAir} Strategic Track</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {daysRemaining} Days Until Examination
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              Targeting <span className="font-semibold text-slate-900">{settings.targetCollege}</span>. 
              {syllabusPercent}% syllabus mastered with rigorous mathematical verification and high-retention spaced drills.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-left">
              <div className="text-[11px] font-medium text-slate-500">Target Air</div>
              <div className="text-xl font-bold text-indigo-700 font-mono">
                AIR #{settings.targetAir}
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            <div className="text-left">
              <div className="text-[11px] font-medium text-slate-500">Active Streak</div>
              <div className="text-xl font-bold text-emerald-600 font-mono">
                {settings.streakCount} Days
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            <div className="text-left">
              <div className="text-[11px] font-medium text-slate-500">Daily Target</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {settings.dailyGoalHours}h
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Primary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Syllabus Mastery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Syllabus Covered</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {syllabusPercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {completedTopics}/{totalTopics} Topics
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${syllabusPercent}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Phase 2 in progress</span>
              <span className="text-indigo-700 font-medium">On Track</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Study Hours */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Study Hours Logged</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {totalHoursStudied}
              </span>
              <span className="text-xs text-slate-400 font-mono">Hours</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Weekly Pace Target</span>
            <span className="font-mono font-semibold text-slate-800">
              {settings.weeklyGoalHours} hrs/wk
            </span>
          </div>
        </div>

        {/* Metric 3: PYQ Accuracy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">PYQ Questions Solved</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {totalPyqsSolved}
              </span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">
                {overallPyqAccuracy}% Acc
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Official GATE Archive</span>
            <span className="font-mono text-slate-700">2024-2026 CS/DA</span>
          </div>
        </div>

        {/* Metric 4: Latest CBT Simulation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Latest Mock CBT</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-700 font-mono">
                {latestMock ? latestMock.score.toFixed(1) : '74.0'}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Predicted Percentile</span>
            <span className="font-mono font-bold text-emerald-600">
              {latestMock ? latestMock.percentile : 99.6}% (AIR &lt; 10)
            </span>
          </div>
        </div>
      </section>

      {/* Peer Benchmarking & Comparison Quick Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-300 font-mono uppercase tracking-wider">
                READ-ONLY PEER BENCHMARKING
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono">
                Live Database Telemetry
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Compare Your Progress &amp; 8-Subject Mastery with Real Peers
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Multi-user radar spider charts, side-by-side metric bars, and read-only syllabus audits powered strictly by Supabase database records.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('PeerCompare')}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <span>Open Comparison Charts</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </section>

      {/* Supabase-powered Needs Revision Targeted Study Widget */}
      <section>
        <NeedsRevisionWidget
          onSelectSubject={onSelectSubject}
          onOpenFormulaVault={onOpenFormulaVault}
        />
      </section>

      {/* Main Split: Today's Tasks & Formula of the Day / Spaced Radar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Focus Action Block (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Academic Targets</h2>
              <p className="text-[11px] text-slate-500">
                Prioritized daily blocks for concept depth and timed problem-solving
              </p>
            </div>
            <button
              onClick={onOpenAddTask}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              + Add Target
            </button>
          </div>

          {/* Task Checklist */}
          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active targets scheduled for today.
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-800'
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
                        <span>{task.topicTitle}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{task.scheduledTime || 'Flexible'}</span>
                        {task.priority === 'urgent' && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-rose-600">Urgent</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {task.durationMinutes}m
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Completed {tasks.filter((t) => t.completed).length} of {tasks.length} total tasks
            </span>
            <button
              onClick={() => setActiveView('Daily')}
              className="text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Open Full Daily Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Spaced Repetition Due & Formula Spotlight (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spaced Repetition Due Alert */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  Spaced Repetition Due ({revisionDueCount})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Ebbinghaus Curve</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Active recall cycle due to consolidate synaptic weights and retain precision.
            </p>

            <div className="space-y-2">
              {revisionDueTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {topic.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {topic.subjectName} · Due Today
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveView('Subjects');
                      if (onSelectSubject) onSelectSubject(topic.subjectId);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-white border border-amber-300 text-amber-800 font-medium hover:bg-amber-100 transition-colors shrink-0"
                  >
                    Revise
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formula of the Day */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sigma className="w-4 h-4 text-emerald-600" />
                <span>Formula of the Day</span>
              </div>
              <button
                onClick={onOpenFormulaVault}
                className="text-[11px] text-indigo-700 font-semibold hover:underline"
              >
                Vault &rarr;
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-800">
              {formulaOfTheDay.title}
            </div>

            <div className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto">
              <code>{formulaOfTheDay.latex}</code>
            </div>

            <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-md flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Edge Case Trap:</strong> {formulaOfTheDay.trap}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 9-Subject Syllabus Progress Matrix */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              9-Subject Syllabus Mastery Matrix
            </h2>
            <p className="text-[11px] text-slate-500">
              Official GATE DA weighting distribution and module completion status
            </p>
          </div>
          <button
            onClick={() => setActiveView('Subjects')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
          >
            Explore Full Syllabus &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {subjects.map((sub) => {
            const completedCount = sub.topics.filter((t) => t.status === 'completed').length;
            const totalCount = sub.topics.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => {
                  setActiveView('Subjects');
                  if (onSelectSubject) onSelectSubject(sub.id);
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                      {sub.name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-indigo-700 shrink-0">
                      {sub.weightageMarks}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1">
                    <span>
                      {completedCount}/{totalCount} Topics
                    </span>
                    <span className="font-bold text-slate-800">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
