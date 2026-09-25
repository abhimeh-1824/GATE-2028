import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  PieChart,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { MockTest } from '../../types';
import { RecordMockModal } from '../modals/RecordMockModal';

export const AnalyticsView: React.FC = () => {
  const { subjects, tasks, mockTests, totalHoursStudied, settings, deleteMockTest } = useStudy();

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [isRecordMockOpen, setIsRecordMockOpen] = useState(false);
  const [mockToEdit, setMockToEdit] = useState<MockTest | null>(null);

  // Derive real weekly study hours from actual completed tasks
  const realWeeklyHours = [0, 0, 0, 0, 0, 0];
  const now = new Date();
  const nowTime = now.getTime();

  tasks.forEach((t) => {
    if (t.completed && t.date) {
      const taskTime = new Date(t.date).getTime();
      const diffWeeks = Math.floor((nowTime - taskTime) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 6) {
        realWeeklyHours[5 - diffWeeks] += t.durationMinutes / 60;
      }
    }
  });

  // If there are few logged tasks yet, ensure currentWeek reflects totalHoursStudied
  const currentWeekHours = Number(Math.max(realWeeklyHours[5], Math.min(totalHoursStudied, settings.weeklyGoalHours)).toFixed(1));

  const weeklyData = [
    { label: 'W-4', hours: Number(realWeeklyHours[1].toFixed(1)) },
    { label: 'W-3', hours: Number(realWeeklyHours[2].toFixed(1)) },
    { label: 'W-2', hours: Number(realWeeklyHours[3].toFixed(1)) },
    { label: 'W-1', hours: Number(realWeeklyHours[4].toFixed(1)) },
    { label: 'Prev', hours: Number(realWeeklyHours[4].toFixed(1)) },
    { label: 'Current', hours: currentWeekHours },
  ];

  const maxWeeklyHours = Math.max(settings.weeklyGoalHours * 1.2, 30);
  const avgHoursPerWeek = totalHoursStudied > 0 ? (totalHoursStudied / Math.max(1, weeklyData.filter(w => w.hours > 0).length || 1)).toFixed(1) : '0.0';

  // Question solving accuracy by subject
  const subjectAccuracy = subjects.map((s) => {
    const totalQ = s.topics.reduce((acc, t) => acc + t.pyqsTotal, 0);
    const solvedQ = s.topics.reduce((acc, t) => acc + t.pyqsSolved, 0);
    const avgAcc =
      s.topics.length > 0
        ? Math.round(s.topics.reduce((acc, t) => acc + t.pyqAccuracy, 0) / s.topics.length)
        : 0;
    return {
      name: s.shortCode,
      fullName: s.name,
      totalQ,
      solvedQ,
      accuracy: avgAcc,
      color: s.color,
    };
  });

  // Dates with activity from tasks or mock tests
  const activeDateSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.completed && t.date) activeDateSet.add(t.date);
  });
  mockTests.forEach((m) => {
    if (m.date) activeDateSet.add(m.date);
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics Header */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 font-mono">
            <span>PERFORMANCE ANALYTICS</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">Active Recall Metrics</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">
            GATE DA Diagnostic Mastery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pacing towards AIR target with high-yield subject accuracy.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'weekly'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Trend
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'monthly'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cumulative Phase
          </button>
        </div>
      </section>

      {/* Top 2 Charts: Weekly Volume & Subject Accuracy */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Study Hours SVG Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Weekly Study Volume (Hours)
              </h2>
              <p className="text-[11px] text-slate-500">
                Target: {settings.weeklyGoalHours} hrs / week consistent pace
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700">
              Avg {avgHoursPerWeek} hrs/wk
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {weeklyData.map((d, i) => {
              const heightPct = Math.min(100, Math.round((d.hours / maxWeeklyHours) * 100));
              const isCurrent = i === weeklyData.length - 1;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-500">
                    {d.hours}h
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden max-w-[42px]">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isCurrent ? 'bg-indigo-700' : 'bg-indigo-300 hover:bg-indigo-400'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 font-medium">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Accuracy by Subject (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                PYQ Accuracy by Subject (%)
              </h2>
              <p className="text-[11px] text-slate-500">
                Threshold for top 100 rank is &gt;85% first-attempt accuracy
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">
              Target &gt; 85%
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {subjectAccuracy.map((sub) => (
              <div key={sub.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {sub.fullName}
                  </span>
                  <span className="font-mono text-slate-600">
                    {sub.accuracy}%{' '}
                    <span className="text-[10px] text-slate-400">
                      ({sub.solvedQ}/{sub.totalQ} Qs)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.accuracy >= 85
                        ? 'bg-emerald-600'
                        : sub.accuracy >= 70
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(2, sub.accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Test Score Progression Curve with Full CRUD */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Mock Test Score Progression (100 Marks CBT)
            </h2>
            <p className="text-[11px] text-slate-500">
              {mockTests.length > 0
                ? `${mockTests.length} Full-Length CBT Simulation ${mockTests.length === 1 ? 'Exam' : 'Exams'} Recorded`
                : 'No CBT mock tests recorded yet. Record your full-length practice tests here.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {mockTests.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                <span className="text-indigo-700 font-bold">
                  Latest: {mockTests[0].score.toFixed(2)}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-600 font-bold">
                  {mockTests[0].percentile}%ile
                </span>
              </div>
            )}

            <button
              onClick={() => {
                setMockToEdit(null);
                setIsRecordMockOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Mock Test</span>
            </button>
          </div>
        </div>

        {/* Visual Mock Test Timeline Cards or Empty State */}
        {mockTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTests.map((mock) => (
              <div
                key={mock.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                    {mock.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {mock.date}
                    </span>
                    <button
                      onClick={() => {
                        setMockToEdit(mock);
                        setIsRecordMockOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition-all cursor-pointer"
                      title="Edit Mock Test"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMockTest(mock.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                      title="Delete Mock Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-700 font-mono">
                    {mock.score.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 100</span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-[11px] flex justify-between text-slate-600 font-mono">
                  <span>Accuracy: {mock.accuracy}%</span>
                  <span className="text-emerald-600 font-bold">
                    {mock.percentile} Percentile
                  </span>
                </div>

                {mock.strongAreas && mock.strongAreas.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <div className="font-semibold text-slate-700 mb-0.5">Strengths:</div>
                    <div className="truncate text-[10px]">
                      {mock.strongAreas.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
            <Award className="w-8 h-8 text-indigo-400 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-700">No Mock CBT Tests Recorded Yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                Record your full-length 100-mark CBT simulations or subject mock tests to predict your percentile and identify weak spots.
              </p>
            </div>
            <button
              onClick={() => {
                setMockToEdit(null);
                setIsRecordMockOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Mock Test</span>
            </button>
          </div>
        )}
      </section>

      {/* 52-Week Consistency & Habit Activity Grid */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Year-Round Consistency Heatmap
            </h2>
            <p className="text-[11px] text-slate-500">
              Active study days and problem drills completed.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-100" />
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-200" />
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400" />
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-700" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[680px] flex gap-1">
            <div className="flex flex-col gap-1 pr-2 text-[9px] font-mono text-slate-400 justify-between py-0.5">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1">
              {Array.from({ length: 52 * 7 }).map((_, i) => {
                const dayIndex = i % 7;
                // Calculate date for this cell (past 52 weeks)
                const cellDate = new Date();
                cellDate.setDate(cellDate.getDate() - (52 * 7 - i));
                const cellStr = cellDate.toISOString().split('T')[0];
                const hasRealActivity = activeDateSet.has(cellStr);

                let bg = 'bg-slate-100';
                if (hasRealActivity) {
                  bg = 'bg-indigo-700';
                }

                return (
                  <div
                    key={i}
                    title={`${cellStr}: ${hasRealActivity ? 'Active study session logged' : 'Rest day'}`}
                    className={`w-2.5 h-2.5 rounded-xs transition-colors hover:ring-1 hover:ring-indigo-500 ${bg}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Record Mock Test Modal */}
      <RecordMockModal
        isOpen={isRecordMockOpen}
        onClose={() => {
          setIsRecordMockOpen(false);
          setMockToEdit(null);
        }}
        mockToEdit={mockToEdit}
      />
    </div>
  );
};
