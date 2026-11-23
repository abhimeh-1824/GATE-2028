import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Award,
  RotateCcw,
  AlertTriangle,
  History,
  Play,
  Loader2,
  FileQuestion,
  Coins,
} from 'lucide-react';
import {
  LevelTest,
  TestQuestion,
  TestAttempt,
  CorrectOptionKey,
  CoinAwardBreakdown,
} from '../../types';
import { fetchQuestionsForTest } from '../../lib/notesTestsService';
import { useStudy } from '../../context/StudyContext';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LevelTest | null;
  breadcrumbs: string[];
  initialReviewAttempt?: TestAttempt | null;
}

type RunnerStage = 'brief' | 'running' | 'review';
type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'unanswered';

const OPTION_KEYS: CorrectOptionKey[] = ['A', 'B', 'C', 'D'];

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  isOpen,
  onClose,
  test,
  breadcrumbs,
  initialReviewAttempt = null,
}) => {
  const { isDemo, testAttempts, recordTestAttempt } = useStudy();

  const [stage, setStage] = useState<RunnerStage>('brief');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CorrectOptionKey>>({});
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number>(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review state
  const [latestAttempt, setLatestAttempt] = useState<TestAttempt | null>(null);
  const [latestCoinsAwarded, setLatestCoinsAwarded] = useState<CoinAwardBreakdown | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  const pastAttempts = useMemo(() => {
    if (!test) return [];
    return testAttempts.filter((a) => a.testId === test.id);
  }, [test, testAttempts]);

  const bestAttempt = useMemo(() => {
    if (!pastAttempts.length) return null;
    return pastAttempts.reduce((best, cur) => (cur.percentage > best.percentage ? cur : best), pastAttempts[0]);
  }, [pastAttempts]);

  // Load questions whenever modal opens for a test
  useEffect(() => {
    if (!isOpen || !test) return;
    let active = true;
    setStage(initialReviewAttempt ? 'review' : 'brief');
    setCurrentIndex(0);
    setAnswers({});
    setMarkedIds(new Set());
    setConfirmSubmitOpen(false);
    setLatestAttempt(initialReviewAttempt || null);
    setLatestCoinsAwarded(null);
    setReviewFilter('all');
    setLoadError(null);
    setLoadingQuestions(true);

    fetchQuestionsForTest(test.id, isDemo)
      .then((res) => {
        if (!active) return;
        if (res.error) setLoadError(res.error);
        setQuestions(res.data || []);
      })
      .catch((err) => {
        if (active) setLoadError(err?.message || 'Could not load test questions.');
      })
      .finally(() => {
        if (active) setLoadingQuestions(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, test, isDemo, initialReviewAttempt]);

  const handleFinalizeSubmit = useCallback(async () => {
    if (!test || isSubmitting) return;
    setIsSubmitting(true);
    setConfirmSubmitOpen(false);

    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const elapsedSeconds = Math.max(
      1,
      Math.min(test.durationMinutes * 60, Math.round((Date.now() - startedAtMs) / 1000))
    );

    const res = await recordTestAttempt({
      testId: test.id,
      answers,
      score: correctCount,
      totalQuestions: questions.length,
      timeTakenSeconds: elapsedSeconds,
    });

    const fallbackAttempt: TestAttempt = res.attempt || {
      id: `local_${Date.now()}`,
      testId: test.id,
      userId: 'current',
      answers,
      score: correctCount,
      totalQuestions: questions.length,
      percentage: questions.length > 0 ? Math.round((correctCount / questions.length) * 1000) / 10 : 0,
      timeTakenSeconds: elapsedSeconds,
      completedAt: new Date().toISOString(),
    };

    setLatestAttempt(fallbackAttempt);
    setLatestCoinsAwarded(res.coinsAwarded || null);
    setIsSubmitting(false);
    setStage('review');
  }, [test, isSubmitting, questions, answers, startedAtMs, recordTestAttempt]);

  // Live countdown timer during active quiz
  useEffect(() => {
    if (!isOpen || stage !== 'running') return;
    if (secondsLeft <= 0) {
      handleFinalizeSubmit();
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, stage, secondsLeft, handleFinalizeSubmit]);

  const startTest = () => {
    if (!test || questions.length === 0) return;
    setAnswers({});
    setMarkedIds(new Set());
    setCurrentIndex(0);
    setSecondsLeft(test.durationMinutes * 60);
    setStartedAtMs(Date.now());
    setConfirmSubmitOpen(false);
    setLatestCoinsAwarded(null);
    setStage('running');
  };

  const selectAnswer = (questionId: string, option: CorrectOptionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const clearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  if (!isOpen || !test) return null;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);
  const isLowTime = stage === 'running' && secondsLeft <= 120;

  const getOptionText = (q: TestQuestion, key: CorrectOptionKey): string => {
    if (key === 'A') return q.optionA;
    if (key === 'B') return q.optionB;
    if (key === 'C') return q.optionC;
    return q.optionD;
  };

  const reviewQuestions = questions.filter((q) => {
    const selected = latestAttempt?.answers?.[q.id];
    if (reviewFilter === 'correct') return selected === q.correctAnswer;
    if (reviewFilter === 'incorrect') return Boolean(selected) && selected !== q.correctAnswer;
    if (reviewFilter === 'unanswered') return !selected;
    return true;
  });

  const passed = latestAttempt ? latestAttempt.percentage >= test.passingPercentage : false;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Test Assessment Runner"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="uppercase tracking-wider font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                {test.entityType} Test
              </span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb}-${idx}`}>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="truncate max-w-[160px]">{crumb}</span>
                </React.Fragment>
              ))}
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate mt-0.5">{test.title}</h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {stage === 'running' && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold tabular-nums ${
                  isLowTime
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <Clock className={`w-4 h-4 ${isLowTime ? 'text-amber-600' : 'text-indigo-600'}`} />
                <span>{formatSeconds(secondsLeft)}</span>
                {isLowTime && <span className="text-[10px] font-sans font-semibold ml-1">LOW TIME</span>}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Close Test Runner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#faf8ff]">
          {loadingQuestions ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading assessment questions...</p>
            </div>
          ) : loadError ? (
            <div className="p-6 max-w-lg mx-auto my-10 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
              <p className="font-semibold">Failed to load test questions</p>
              <p className="text-xs mt-1">{loadError}</p>
            </div>
          ) : stage === 'brief' ? (
            /* ================= STAGE 1: PRE-TEST BRIEF & ATTEMPT HISTORY ================= */
            <div className="p-5 sm:p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{test.title}</h3>
                  {test.description && (
                    <p className="text-sm text-slate-600 mt-1">{test.description}</p>
                  )}
                </div>

                {/* Key Exam Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500">Questions</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {questions.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500">Time Limit</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {test.durationMinutes} min
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500">Passing Target</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 mt-0.5">
                      {test.passingPercentage}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500">Best Score</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                      {bestAttempt ? `${bestAttempt.percentage}%` : '—'}
                    </div>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                    <FileQuestion className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">No questions added to this test yet</p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Open Notes &amp; Tests Studio to import questions via CSV/Excel or add questions manually.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Single-choice MCQ (Options A, B, C, D) with instant explanation review.</li>
                      <li>• Use the Question Palette to jump or flag questions for review.</li>
                      <li>• Test submits automatically when the countdown reaches 00:00.</li>
                    </ul>

                    <button
                      type="button"
                      onClick={startTest}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {pastAttempts.length > 0 ? 'Start New Attempt' : 'Start Timed Test'}
                    </button>
                  </div>
                )}
              </div>

              {/* Attempt History */}
              {pastAttempts.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      Your Attempt History ({pastAttempts.length})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Correct / Wrong</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Accuracy</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Time Taken</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Status</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pastAttempts.slice(0, 8).map((att) => {
                          const attPass = att.percentage >= test.passingPercentage;
                          const attAnswered = Object.keys(att.answers || {}).length;
                          const attWrong = Math.max(0, attAnswered - att.score);
                          return (
                            <tr key={att.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 text-slate-700">
                                {new Date(att.completedAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">
                                <span className="text-emerald-700">{att.score}✓</span>
                                <span className="text-slate-300 mx-1">/</span>
                                <span className="text-rose-600">{attWrong}✕</span>
                                <span className="text-slate-400 text-[10px] ml-1">
                                  ({att.totalQuestions} Qs)
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-indigo-700">
                                {att.percentage}%
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-600">
                                {formatSeconds(att.timeTakenSeconds)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                    attPass
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {attPass ? 'PASSED' : 'REVIEW'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLatestAttempt(att);
                                    setReviewFilter('all');
                                    setStage('review');
                                  }}
                                  className="px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold"
                                >
                                  View Result
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : stage === 'running' && currentQuestion ? (
            /* ================= STAGE 2: LIVE TWO-ZONE EXAM INTERFACE ================= */
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 70%: Question Stage */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between min-h-[420px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold font-mono text-indigo-700">
                      QUESTION {currentIndex + 1} OF {questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          currentQuestion.difficulty === 'hard'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : currentQuestion.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {currentQuestion.difficulty}
                      </span>
                      {markedIds.has(currentQuestion.id) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          MARKED FOR REVIEW
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.questionText}
                  </p>

                  {currentQuestion.questionImageUrl && (
                    <div className="my-3 p-3 rounded-lg border border-slate-200 bg-slate-50 flex justify-center">
                      <img
                        src={currentQuestion.questionImageUrl}
                        alt={`Question ${currentIndex + 1} diagram`}
                        className="max-h-64 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* Options A–D */}
                  <div className="space-y-2.5 pt-2">
                    {OPTION_KEYS.map((key) => {
                      const isSelected = answers[currentQuestion.id] === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectAnswer(currentQuestion.id, key)}
                          className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 text-slate-900'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="text-sm leading-snug">
                            {getOptionText(currentQuestion, key)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-5 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => clearAnswer(currentQuestion.id)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMarkForReview(currentQuestion.id)}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        markedIds.has(currentQuestion.id)
                          ? 'bg-purple-50 border-purple-300 text-purple-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {markedIds.has(currentQuestion.id) ? 'Unmark' : 'Mark Review'}
                    </button>
                  </div>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold"
                    >
                      Save &amp; Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmSubmitOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Review &amp; Submit
                    </button>
                  )}
                </div>
              </div>

              {/* Right 30%: Question Palette & Submit Control */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-base font-bold font-mono tabular-nums text-emerald-700">
                        {answeredCount}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700">Answered</div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="text-base font-bold font-mono tabular-nums text-purple-700">
                        {markedIds.size}
                      </div>
                      <div className="text-[10px] font-semibold text-purple-700">Marked</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-base font-bold font-mono tabular-nums text-slate-700">
                        {remainingCount}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600">Unanswered</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Question Palette
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {questions.map((q, idx) => {
                        const isCurrent = idx === currentIndex;
                        const isAns = Boolean(answers[q.id]);
                        const isMarked = markedIds.has(q.id);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-8 rounded-md text-xs font-mono font-bold border transition-all ${
                              isCurrent
                                ? 'ring-2 ring-indigo-600 border-indigo-700 bg-indigo-700 text-white'
                                : isMarked
                                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                                  : isAns
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!confirmSubmitOpen ? (
                    <button
                      type="button"
                      onClick={() => setConfirmSubmitOpen(true)}
                      className="w-full py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold transition-colors"
                    >
                      Submit Assessment
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2.5">
                      <div className="flex items-start gap-2 text-amber-900">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <p className="text-xs leading-snug">
                          Submit now with <strong>{answeredCount}/{questions.length}</strong> answered?
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleFinalizeSubmit}
                          className="flex-1 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSubmitOpen(false)}
                          className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ================= STAGE 3: INSTANT SCORE & EXPLANATION REVIEW ================= */
            (() => {
              const reviewTotal = latestAttempt?.totalQuestions ?? questions.length;
              const reviewCorrect = latestAttempt?.score ?? 0;
              const reviewAnswered = Object.keys(latestAttempt?.answers || {}).length;
              const reviewWrong = Math.max(0, reviewAnswered - reviewCorrect);
              const reviewSkipped = Math.max(0, reviewTotal - reviewAnswered);

              return (
            <div className="p-5 sm:p-6 max-w-5xl mx-auto space-y-5">
              {/* Score Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        passed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-base font-bold text-slate-900">Test Result &amp; Review</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            passed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {passed ? 'PASSED' : 'NEEDS REVISION'} (Target {test.passingPercentage}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Score:{' '}
                        <strong className="font-mono text-slate-900">
                          {reviewCorrect} / {reviewTotal}
                        </strong>{' '}
                        • Percentage:{' '}
                        <strong className="font-mono text-indigo-700">
                          {latestAttempt?.percentage ?? 0}%
                        </strong>{' '}
                        • Time:{' '}
                        <strong className="font-mono text-slate-800">
                          {formatSeconds(latestAttempt?.timeTakenSeconds ?? 0)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {pastAttempts.length > 1 && (
                      <select
                        value={latestAttempt?.id || ''}
                        onChange={(e) => {
                          const found = pastAttempts.find((a) => a.id === e.target.value);
                          if (found) setLatestAttempt(found);
                        }}
                        aria-label="Switch past attempt"
                        className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
                      >
                        {pastAttempts.map((att, idx) => (
                          <option key={att.id} value={att.id}>
                            Attempt #{pastAttempts.length - idx} ({att.percentage}% •{' '}
                            {new Date(att.completedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={startTest}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake Test
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Explicit Correct / Wrong / Skipped Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div className="px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Correct
                    </span>
                    <span className="text-base font-bold font-mono tabular-nums text-emerald-800">
                      {reviewCorrect}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Wrong
                    </span>
                    <span className="text-base font-bold font-mono tabular-nums text-rose-800">
                      {reviewWrong}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Skipped</span>
                    <span className="text-base font-bold font-mono tabular-nums text-slate-700">
                      {reviewSkipped}
                    </span>
                  </div>
                </div>

                {/* Coins Earned Breakdown Banner */}
                {latestCoinsAwarded && latestCoinsAwarded.totalCoins > 0 && (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950 font-mono">
                          +{latestCoinsAwarded.totalCoins} Coins Earned on this Attempt!
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {latestCoinsAwarded.items.map((item, idx) => (
                            <span
                              key={`${item.category}-${idx}`}
                              className="text-[11px] text-amber-900 bg-white/80 border border-amber-200 px-2 py-0.5 rounded font-medium"
                            >
                              +{item.amount} · {item.reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Question-by-Question Review
                </h4>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                  {(['all', 'incorrect', 'correct', 'unanswered'] as ReviewFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setReviewFilter(f)}
                      className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-colors ${
                        reviewFilter === f
                          ? 'bg-indigo-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Cards */}
              <div className="space-y-3">
                {reviewQuestions.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                    No questions match the "{reviewFilter}" filter.
                  </div>
                ) : (
                  reviewQuestions.map((q) => {
                    const qNum = questions.findIndex((item) => item.id === q.id) + 1;
                    const chosen = latestAttempt?.answers?.[q.id];
                    const isCorrect = chosen === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="font-mono text-indigo-700 mr-2">Q{qNum}.</span>
                            {q.questionText}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : chosen
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> CORRECT
                              </>
                            ) : chosen ? (
                              <>
                                <XCircle className="w-3 h-3" /> INCORRECT
                              </>
                            ) : (
                              'UNANSWERED'
                            )}
                          </span>
                        </div>

                        {q.questionImageUrl && (
                          <img
                            src={q.questionImageUrl}
                            alt={`Question ${qNum}`}
                            className="max-h-48 object-contain rounded border border-slate-200"
                          />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {OPTION_KEYS.map((key) => {
                            const isRightOpt = q.correctAnswer === key;
                            const isChosenOpt = chosen === key;
                            return (
                              <div
                                key={key}
                                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                                  isRightOpt
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                    : isChosenOpt && !isRightOpt
                                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-mono font-bold">{key}.</span>
                                <span className="flex-1">{getOptionText(q, key)}</span>
                                {isRightOpt && (
                                  <span className="text-[10px] font-bold uppercase text-emerald-700">
                                    Answer
                                  </span>
                                )}
                                {isChosenOpt && !isRightOpt && (
                                  <span className="text-[10px] font-bold uppercase text-rose-700">
                                    Yours
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700">
                            <span className="font-bold text-indigo-800">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
