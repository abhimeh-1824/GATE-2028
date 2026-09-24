import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const WeeklyView: React.FC = () => {
  const { settings, tasks, subjects, setActiveView } = useStudy();

  const weeklyGoalHours = settings.weeklyGoalHours || 28;
  const currentWeekCompletedHours = 22.5;
  const weekProgressPct = Math.min(100, Math.round((currentWeekCompletedHours / weeklyGoalHours) * 100));

  // 7-Day schedule data for the current week
  const weekDays = [
    {
      day: 'Mon',
      date: 'Sep 21',
      hours: 4.2,
      targetHours: 4.5,
      tasksDone: 4,
      totalTasks: 4,
      focusSubject: 'Linear Algebra',
      topic: 'Eigenvalues & Characteristic Eq',
      status: 'completed',
    },
    {
      day: 'Tue',
      date: 'Sep 22',
      hours: 4.5,
      targetHours: 4.5,
      tasksDone: 3,
      totalTasks: 3,
      focusSubject: 'Calculus & Opt',
      topic: 'Multivariable Hessians & Minima',
      status: 'completed',
    },
    {
      day: 'Wed',
      date: 'Sep 23',
      hours: 4.0,
      targetHours: 4.5,
      tasksDone: 4,
      totalTasks: 5,
      focusSubject: 'Machine Learning',
      topic: 'SVM Maximum Margin & Dual',
      status: 'completed',
    },
    {
      day: 'Thu',
      date: 'Sep 24',
      hours: 3.8,
      targetHours: 4.5,
      tasksDone: 2,
      totalTasks: 6,
      focusSubject: 'Linear Algebra',
      topic: 'SVD & Low-Rank Approximation',
      status: 'current',
    },
    {
      day: 'Fri',
      date: 'Sep 25',
      hours: 0,
      targetHours: 4.5,
      tasksDone: 0,
      totalTasks: 4,
      focusSubject: 'Probability',
      topic: 'Central Limit Theorem & Tests',
      status: 'upcoming',
    },
    {
      day: 'Sat',
      date: 'Sep 26',
      hours: 0,
      targetHours: 5.0,
      tasksDone: 0,
      totalTasks: 3,
      focusSubject: 'DSA & Graphs',
      topic: 'Dijkstra & AVL Tree Rotations',
      status: 'upcoming',
    },
    {
      day: 'Sun',
      date: 'Sep 27',
      hours: 0,
      targetHours: 4.0,
      tasksDone: 0,
      totalTasks: 2,
      focusSubject: 'Full Length CBT',
      topic: 'Simulation Mock 4 (180 mins)',
      status: 'upcoming',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Weekly Progress Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <CalendarDays className="w-4 h-4" />
              <span>ACADEMIC WEEK 38</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">Sep 21 – Sep 27, 2026</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Weekly Study Pacing & Syllabus Sprint
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <div className="text-slate-400">Target Pacing</div>
              <div className="text-lg font-bold text-slate-800">
                {currentWeekCompletedHours} / {weeklyGoalHours} hrs
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-slate-400">Weekly Target</div>
              <div className="text-lg font-bold text-indigo-700">{weekProgressPct}%</div>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-700 h-full rounded-full transition-all"
            style={{ width: `${weekProgressPct}%` }}
          />
        </div>
      </section>

      {/* 7-Day Day-by-Day Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            7-Day Curriculum Breakdown
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            4.5 hrs/day target pace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                d.status === 'current'
                  ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-200'
                  : d.status === 'completed'
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-200/70 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span
                    className={`font-bold ${
                      d.status === 'current' ? 'text-indigo-700' : 'text-slate-800'
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.date}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 truncate mb-1">
                  {d.focusSubject}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {d.topic}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span
                  className={
                    d.hours >= d.targetHours
                      ? 'text-emerald-600 font-bold'
                      : d.status === 'current'
                      ? 'text-indigo-700 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {d.hours > 0 ? `${d.hours}h` : '—'}
                </span>
                <span className="text-slate-400">
                  {d.tasksDone}/{d.totalTasks} Done
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weak Areas Diagnostics & Weekend Mock Scheduler */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Diagnostics Scorecard */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Diagnostic Review
            </h3>
            <span className="text-xs text-indigo-700 font-semibold font-mono">
              Week 38 Audit
            </span>
          </div>

          <div className="space-y-3">
            {/* Concepts Mastered */}
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mastered Concepts This Week</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-700 space-y-0.5">
                <li>Singular Value Decomposition (SVD) low-rank proofs</li>
                <li>Hessian matrix positive definiteness classification</li>
                <li>Support Vector Machine dual formulation and soft margin</li>
              </ul>
            </div>

            {/* Weak Areas Flagged */}
            <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Weak Areas Flagged for Review</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                <li>Bayesian Networks d-separation rules in collider v-structures</li>
                <li>BCNF decomposition: testing dependency preservation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Weekend Mock CBT Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Sunday CBT Simulation Mock 4
              </h3>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Scheduled 27 Sep
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Standard 3-hour exam simulation (09:30 AM to 12:30 PM). 65 questions across all 9 technical modules and General Aptitude. Virtual calculator required.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <div className="text-slate-400 text-[10px]">Total Marks</div>
                <div className="font-bold text-slate-800 font-mono">100 M</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Duration</div>
                <div className="font-bold text-slate-800 font-mono">180 Min</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Target Score</div>
                <div className="font-bold text-emerald-600 font-mono">&gt; 78.0</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Exam slot: 09:30 - 12:30</span>
            <button
              onClick={() => setActiveView('Calendar')}
              className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>View Exam Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
