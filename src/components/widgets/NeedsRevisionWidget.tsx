import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Play,
  TrendingDown,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { analyzeTestPerformance, TestRevisionFlag } from '../../utils/testPerformanceAnalysis';
import { TestRunnerModal } from '../modals/TestRunnerModal';
import { LevelTest } from '../../types';
import { soundManager } from '../../utils/audio';

interface NeedsRevisionWidgetProps {
  onSelectSubject?: (subjectId: string) => void;
  onOpenFormulaVault?: () => void;
}

export const NeedsRevisionWidget: React.FC<NeedsRevisionWidgetProps> = ({
  onSelectSubject,
}) => {
  const { subjects, levelTests, testAttempts, setActiveView } = useStudy();
  const [filterType, setFilterType] = useState<'all' | 'declining' | 'low_score'>('all');
  const [retakeTest, setRetakeTest] = useState<{ test: LevelTest; breadcrumbs: string[] } | null>(
    null
  );

  const analysis = useMemo(
    () => analyzeTestPerformance(testAttempts, levelTests, subjects),
    [testAttempts, levelTests, subjects]
  );

  const flags = analysis.needsRevision;

  const filteredFlags = useMemo(() => {
    if (filterType === 'declining') {
      return flags.filter((f) => f.reason === 'declining' || f.reason === 'both');
    }
    if (filterType === 'low_score') {
      return flags.filter((f) => f.reason === 'low_score' || f.reason === 'both');
    }
    return flags;
  }, [flags, filterType]);

  const decliningCount = flags.filter((f) => f.reason === 'declining' || f.reason === 'both').length;
  const lowScoreCount = flags.filter((f) => f.reason === 'low_score' || f.reason === 'both').length;

  const handleOpenSyllabus = (flag: TestRevisionFlag) => {
    soundManager.playSubtleTick();
    if (onSelectSubject && flag.subjectId) {
      onSelectSubject(flag.subjectId);
    } else {
      setActiveView('Subjects');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Needs Revision</h2>
            {analysis.totalAttempts > 0 && (
              <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-500">
                · {flags.length} flagged from {analysis.uniqueTestsAttempted}{' '}
                {analysis.uniqueTestsAttempted === 1 ? 'tested area' : 'tested areas'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Based strictly on your <strong className="text-slate-700">latest test attempts</strong>:
            flags any test scoring below <strong className="text-slate-700">60%</strong> or dropping
            from your previous score.
          </p>
        </div>

        {/* Filter controls (only shown when user has revision flags) */}
        {flags.length > 0 && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              All ({flags.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('declining')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'declining'
                  ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Score Dropped ({decliningCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('low_score')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'low_score'
                  ? 'bg-white text-amber-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Below 60% ({lowScoreCount})
            </button>
          </div>
        )}
      </div>

      {/* State 1: Brand-new user / Zero test attempts yet */}
      {analysis.totalAttempts === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                No revision alerts yet — take a test to start tracking
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                Nothing is flagged until you actually attempt a Subject, Topic, or Subtopic test.
                After every test, we compare your latest score with previous attempts and highlight
                exact weak or declining areas here.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('Tests')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Open Tests Hub</span>
          </button>
        </div>
      ) : filteredFlags.length === 0 ? (
        /* State 2: User has attempted tests and all latest scores are strong & steady/improving */
        <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-emerald-900">
                {filterType === 'all'
                  ? 'All tested areas are on track'
                  : 'No tests match this filter'}
              </h3>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {filterType === 'all'
                  ? `Your latest test scores across ${analysis.uniqueTestsAttempted} ${
                      analysis.uniqueTestsAttempted === 1 ? 'test' : 'tests'
                    } are ≥ 60% with no score drops (overall avg ${analysis.overallAveragePct}%).`
                  : 'Switch to "All" to view remaining revision flags.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('Analytics')}
            className="px-3.5 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Trend Analysis
          </button>
        </div>
      ) : (
        /* State 3: Real test-based revision cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredFlags.slice(0, 6).map((flag) => {
            const isDropped = flag.deltaPct !== null && flag.deltaPct < 0;
            const isImproved = flag.deltaPct !== null && flag.deltaPct > 0;

            return (
              <div
                key={flag.testId}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  {/* Clean unboxed hierarchy metadata */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wide text-indigo-700">
                      {flag.entityType}
                    </span>
                    <span className="font-mono tabular-nums text-[10px]">
                      {flag.attemptCount} {flag.attemptCount === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {flag.test.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate" title={flag.breadcrumb}>
                    {flag.breadcrumb}
                  </p>

                  {/* Latest Score vs Previous Attempt */}
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">Latest Score</div>
                      <div className="flex items-baseline gap-1 mt-0.5 font-mono tabular-nums">
                        <span
                          className={`text-sm font-bold ${
                            flag.latestPercentage < 60 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {flag.latestPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({flag.latestScore}/{flag.latestTotalQuestions})
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">vs Previous</div>
                      <div className="mt-0.5 flex items-center gap-1 font-mono tabular-nums text-xs font-bold">
                        {isDropped ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-600">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {flag.deltaPct}%
                            <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                              (was {flag.previousPercentage}%)
                            </span>
                          </span>
                        ) : isImproved ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{flag.deltaPct}%
                            <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                              (was {flag.previousPercentage}%)
                            </span>
                          </span>
                        ) : flag.previousPercentage !== null ? (
                          <span className="text-slate-600">0% (same)</span>
                        ) : (
                          <span className="text-[11px] font-sans font-medium text-slate-500">
                            1st attempt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isDropped && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 pt-0.5">
                      <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                      <span>Score dropped compared to your previous attempt</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRetakeTest({
                        test: flag.test,
                        breadcrumbs: flag.breadcrumb.split(' → '),
                      })
                    }
                    className="flex-1 py-1.5 px-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Retake Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSyllabus(flag)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>Notes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredFlags.length > 6 && (
        <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing top 6 of {filteredFlags.length} tests needing revision.
          </span>
          <button
            type="button"
            onClick={() => setActiveView('Analytics')}
            className="font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
          >
            See full breakdown in Analytics
          </button>
        </div>
      )}

      {/* Direct Retake Runner Modal */}
      <TestRunnerModal
        isOpen={Boolean(retakeTest)}
        onClose={() => setRetakeTest(null)}
        test={retakeTest?.test || null}
        breadcrumbs={retakeTest?.breadcrumbs || []}
      />
    </div>
  );
};
