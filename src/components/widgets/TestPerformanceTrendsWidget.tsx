import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  analyzeTestPerformance,
  EntityTrendRecord,
} from '../../utils/testPerformanceAnalysis';

interface TestPerformanceTrendsWidgetProps {
  mode?: 'compact' | 'full';
  onSelectSubject?: (subjectId: string) => void;
}

type TrendTab = 'subject' | 'topic' | 'subtopic' | 'timeline';

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const TestPerformanceTrendsWidget: React.FC<TestPerformanceTrendsWidgetProps> = ({
  mode = 'full',
  onSelectSubject,
}) => {
  const { subjects, levelTests, testAttempts, setActiveView } = useStudy();
  const [activeTab, setActiveTab] = useState<TrendTab>('subject');

  const analysis = useMemo(
    () => analyzeTestPerformance(testAttempts, levelTests, subjects),
    [testAttempts, levelTests, subjects]
  );

  const activeRows: EntityTrendRecord[] = useMemo(() => {
    if (activeTab === 'subject') return analysis.bySubject;
    if (activeTab === 'topic') return analysis.byTopic;
    if (activeTab === 'subtopic') return analysis.bySubtopic;
    return [];
  }, [activeTab, analysis]);

  const visibleRows = mode === 'compact' ? activeRows.slice(0, 5) : activeRows;

  // Compact mode on Dashboard stays quiet until user takes at least 1 test (NeedsRevisionWidget already has the CTA)
  if (mode === 'compact' && analysis.totalAttempts === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header + Level Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Subject, Topic &amp; Subtopic Score Progression
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Compares your <strong className="text-slate-700">previous vs latest</strong> test
            attempts to show where marks are improving or starting to drop.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('subject')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'subject'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Subjects ({analysis.bySubject.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('topic')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'topic'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Topics ({analysis.byTopic.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subtopic')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'subtopic'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Subtopics ({analysis.bySubtopic.length})
            </button>
            {mode === 'full' && (
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                All Attempts ({analysis.totalAttempts})
              </button>
            )}
          </div>

          {mode === 'compact' && (
            <button
              type="button"
              onClick={() => setActiveView('Analytics')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 cursor-pointer"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State for Full Mode when user hasn't attempted any test */}
      {analysis.totalAttempts === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
          <TrendingUp className="w-7 h-7 text-indigo-500 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900">
              No Test Progression Data Yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Attempt tests at the Subject, Topic, or Subtopic level. Once you take tests, this panel
              tracks whether your scores are rising or falling compared to earlier attempts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('Tests')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer"
          >
            <span>Go to Tests Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="text-[11px] text-slate-500 font-medium">Latest Test Score</div>
              <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-xl font-extrabold text-slate-900">
                  {analysis.latestAttempt ? `${analysis.latestAttempt.percentage}%` : '—'}
                </span>
                {analysis.overallLatestDelta !== null && (
                  <span
                    className={`text-xs font-bold ${
                      analysis.overallLatestDelta > 0
                        ? 'text-emerald-600'
                        : analysis.overallLatestDelta < 0
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {analysis.overallLatestDelta > 0
                      ? `+${analysis.overallLatestDelta}%`
                      : `${analysis.overallLatestDelta}%`}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {analysis.latestAttempt?.testTitle || '—'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70">
              <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Improving Areas</span>
              </div>
              <div className="mt-1 text-xl font-extrabold font-mono tabular-nums text-emerald-700">
                {analysis.improvingCount}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">
                Latest score higher than previous
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200/70">
              <div className="text-[11px] text-rose-800 font-medium flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Dropping Areas</span>
              </div>
              <div className="mt-1 text-xl font-extrabold font-mono tabular-nums text-rose-700">
                {analysis.decliningCount}
              </div>
              <div className="text-[10px] text-rose-700/80 mt-0.5">
                Latest score lower than previous
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="text-[11px] text-slate-500 font-medium">Overall Average</div>
              <div className="mt-1 text-xl font-extrabold font-mono tabular-nums text-indigo-700">
                {analysis.overallAveragePct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Across {analysis.totalAttempts}{' '}
                {analysis.totalAttempts === 1 ? 'attempt' : 'attempts'}
              </div>
            </div>
          </div>

          {/* Full Mode Visual Chronological Progression Chart */}
          {mode === 'full' && analysis.timeline.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Attempt-by-Attempt Score Trajectory (Last {Math.min(12, analysis.timeline.length)}{' '}
                  Tests)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Dashed line = 60% target floor
                </span>
              </div>

              <div className="relative h-44 pt-4 pb-1 px-1">
                {/* 60% benchmark line */}
                <div
                  className="absolute inset-x-0 border-t border-dashed border-amber-400/80 pointer-events-none"
                  style={{ bottom: '60%' }}
                >
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1 rounded -mt-2 inline-block">
                    60%
                  </span>
                </div>

                <div className="h-full flex items-end gap-2 sm:gap-3 relative z-10">
                  {analysis.timeline.slice(-12).map((pt, idx, arr) => {
                    const prev = idx > 0 ? arr[idx - 1] : null;
                    const diff = prev ? pt.percentage - prev.percentage : null;
                    const barColor =
                      pt.percentage < 60
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : diff !== null && diff < 0
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-indigo-600 hover:bg-indigo-700';

                    return (
                      <div
                        key={pt.attemptId}
                        className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1"
                        title={`${pt.testTitle} (${pt.breadcrumb}) — ${pt.percentage}% (${pt.score}/${pt.totalQuestions}) on ${formatShortDate(pt.completedAt)}`}
                      >
                        <span className="text-[10px] font-mono tabular-nums font-bold text-slate-700">
                          {pt.percentage}%
                        </span>
                        <div className="w-full max-w-[38px] bg-slate-200/70 rounded-t-md flex-1 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-md transition-all duration-300 ${barColor}`}
                            style={{ height: `${Math.max(6, pt.percentage)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">
                          {formatShortDate(pt.completedAt) || `#${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Timeline vs Subject/Topic/Subtopic Comparison Table */}
          {activeTab === 'timeline' ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Test &amp; Level</th>
                    <th className="py-2.5 px-4 font-semibold">Score</th>
                    <th className="py-2.5 px-4 font-semibold text-right">vs Previous Attempt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...analysis.timeline].reverse().map((pt) => (
                    <tr key={pt.attemptId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatShortDate(pt.completedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{pt.testTitle}</div>
                        <div className="text-[11px] text-slate-500">
                          <span className="uppercase font-mono text-[10px] text-indigo-700 mr-1.5">
                            {pt.entityType}
                          </span>
                          {pt.breadcrumb}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            pt.percentage >= 60 ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {pt.percentage}%
                        </span>{' '}
                        <span className="text-slate-400">
                          ({pt.score}/{pt.totalQuestions})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {pt.deltaFromPrevious === null ? (
                          <span className="text-slate-400 font-sans text-[11px]">First attempt</span>
                        ) : pt.deltaFromPrevious > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />+{pt.deltaFromPrevious}%
                            <span className="text-slate-400 font-normal ml-1">
                              (from {pt.previousSameEntityPct}%)
                            </span>
                          </span>
                        ) : pt.deltaFromPrevious < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {pt.deltaFromPrevious}%
                            <span className="text-slate-400 font-normal ml-1">
                              (from {pt.previousSameEntityPct}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500">0% (unchanged)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No {activeTab}-level tests attempted yet. Attempt a {activeTab} test to see its
              before-vs-after progression here.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">
                      {activeTab === 'subject'
                        ? 'Subject'
                        : activeTab === 'topic'
                        ? 'Topic'
                        : 'Subtopic'}
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">Attempts</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Previous</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Latest</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Trend</th>
                    <th className="py-2.5 px-4 font-semibold text-right hidden sm:table-cell">
                      Score History
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectSubject && row.subjectId) {
                              onSelectSubject(row.subjectId);
                            } else {
                              setActiveView('Subjects');
                            }
                          }}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {row.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{row.parentPath}</div>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {row.attemptCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                        {row.previousPct !== null ? `${row.previousPct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-bold ${
                            row.latestPct < 60 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {row.latestPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {row.trend === 'improving' ? (
                          <span className="inline-flex items-center gap-0.5 font-mono tabular-nums font-bold text-emerald-700">
                            <ArrowUpRight className="w-3.5 h-3.5" />+{row.deltaPct}% Improving
                          </span>
                        ) : row.trend === 'declining' ? (
                          <span className="inline-flex items-center gap-0.5 font-mono tabular-nums font-bold text-rose-600">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {row.deltaPct}% Dropping
                          </span>
                        ) : row.trend === 'steady' ? (
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-500">
                            <Minus className="w-3 h-3" />
                            0% Steady
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Baseline (1st)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex items-end justify-end gap-1 h-7">
                          {row.history.slice(-6).map((h) => (
                            <div
                              key={h.attemptId}
                              title={`${h.testTitle}: ${h.percentage}% (${h.score}/${h.totalQuestions})`}
                              className={`w-2.5 rounded-t-xs ${
                                h.percentage >= 75
                                  ? 'bg-emerald-500'
                                  : h.percentage >= 60
                                  ? 'bg-indigo-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ height: `${Math.max(18, h.percentage)}%` }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};
