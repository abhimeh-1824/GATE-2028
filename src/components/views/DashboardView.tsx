import React from 'react';
import { Clock } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { NeedsRevisionWidget } from '../widgets/NeedsRevisionWidget';

interface DashboardViewProps {
  onOpenFormulaVault: () => void;
  onOpenAddTask?: () => void;
  onSelectSubject?: (subjectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenFormulaVault,
  onSelectSubject,
}) => {
  const {
    subjects,
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
    setActiveView,
  } = useStudy();

  const latestMock = mockTests[mockTests.length - 1];

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
              {latestMock ? (
                <>
                  <span className="text-2xl font-extrabold text-indigo-700 font-mono">
                    {latestMock.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 100</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-slate-400 font-mono">
                    —
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 100</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{latestMock ? 'Predicted Percentile' : 'Status'}</span>
            <span className={`font-mono font-bold ${latestMock ? 'text-emerald-600' : 'text-slate-400'}`}>
              {latestMock ? `${latestMock.percentile}% (AIR < 10)` : 'No tests recorded yet'}
            </span>
          </div>
        </div>
      </section>

      {/* Supabase-powered Needs Revision Targeted Study Widget */}
      <section>
        <NeedsRevisionWidget
          onSelectSubject={onSelectSubject}
        />
      </section>

      {/* Spaced Repetition Due Alert */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Spaced Repetition Due ({revisionDueCount})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Ebbinghaus Curve</span>
        </div>

        <p className="text-xs text-slate-500">
          Active recall cycle due to consolidate synaptic weights and retain precision.
        </p>

        {revisionDueTopics.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">
            No topics currently due for spaced repetition.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {revisionDueTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-2"
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
                  className="text-[11px] px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-800 font-medium hover:bg-amber-100 transition-colors shrink-0"
                >
                  Revise
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
