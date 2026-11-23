import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  Play,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  CircleDashed,
  User,
  Calendar,
  ChevronRight,
  Plus,
  RefreshCw,
  Award,
  X,
  Coins,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { LevelTest, NoteEntityType, TestAttempt } from '../../types';
import { TestRunnerModal } from '../modals/TestRunnerModal';

type AttemptStatusFilter = 'all' | 'attempted' | 'not_attempted';
type LevelFilter = 'all' | NoteEntityType;

interface ResolvedHierarchy {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  topicId: string | null;
  topicTitle: string | null;
  subtopicKey: string | null;
  subtopicName: string | null;
  breadcrumbs: string[];
}

function getAttemptBreakdown(attempt: TestAttempt) {
  const correct = attempt.score;
  const answered = Object.keys(attempt.answers || {}).length;
  const wrong = Math.max(0, answered - correct);
  const skipped = Math.max(0, attempt.totalQuestions - answered);
  return { correct, wrong, skipped };
}

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export const TestsView: React.FC = () => {
  const {
    subjects,
    levelTests,
    testAttempts,
    currentUser,
    isAdmin,
    notesTestsLoading,
    refreshNotesAndTests,
    setActiveView,
  } = useStudy();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [subtopicFilter, setSubtopicFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [attemptStatusFilter, setAttemptStatusFilter] = useState<AttemptStatusFilter>('all');

  // Runner / Result review modal state
  const [modalState, setModalState] = useState<{
    test: LevelTest;
    breadcrumbs: string[];
    initialReviewAttempt?: TestAttempt | null;
  } | null>(null);

  // Lookup maps to resolve Subject -> Topic -> Subtopic names cleanly
  const hierarchyIndex = useMemo(() => {
    const subjectMap = new Map<string, { name: string; shortCode: string }>();
    const topicMap = new Map<string, { title: string; subjectId: string }>();
    const subtopicMap = new Map<string, { name: string; topicId: string; subjectId: string }>();

    subjects.forEach((subj) => {
      subjectMap.set(subj.id, { name: subj.name, shortCode: subj.shortCode });
      subj.topics.forEach((topic) => {
        topicMap.set(topic.id, { title: topic.title, subjectId: subj.id });
        topic.subtopics.forEach((subName, idx) => {
          const stableId = topic.subtopicItems?.[idx]?.id || `${topic.id}::sub_${idx}`;
          subtopicMap.set(stableId, { name: subName, topicId: topic.id, subjectId: subj.id });
        });
      });
    });

    return { subjectMap, topicMap, subtopicMap };
  }, [subjects]);

  const resolveTestHierarchy = (test: LevelTest): ResolvedHierarchy => {
    const subj = hierarchyIndex.subjectMap.get(test.subjectId);
    const topic = test.topicId ? hierarchyIndex.topicMap.get(test.topicId) : undefined;
    const subtopic = test.subtopicId ? hierarchyIndex.subtopicMap.get(test.subtopicId) : undefined;

    const subjectName = subj?.name || 'Subject';
    const subjectCode = subj?.shortCode || 'SUB';
    const topicTitle = topic?.title || (test.entityType !== 'subject' ? 'Topic' : null);
    const subtopicName = subtopic?.name || (test.entityType === 'subtopic' ? 'Subtopic' : null);

    const breadcrumbs: string[] = [subjectName];
    if (topicTitle) breadcrumbs.push(topicTitle);
    if (subtopicName) breadcrumbs.push(subtopicName);

    return {
      subjectId: test.subjectId,
      subjectName,
      subjectCode,
      topicId: test.topicId ?? null,
      topicTitle,
      subtopicKey: test.subtopicId ?? null,
      subtopicName,
      breadcrumbs,
    };
  };

  // Attempts grouped by testId (newest first)
  const attemptsByTest = useMemo(() => {
    const map = new Map<string, TestAttempt[]>();
    testAttempts.forEach((att) => {
      const list = map.get(att.testId) || [];
      list.push(att);
      map.set(att.testId, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      map.set(key, list);
    });
    return map;
  }, [testAttempts]);

  // Visible tests (students see active tests + their own tests; admins see all)
  const accessibleTests = useMemo(() => {
    return levelTests.filter(
      (t) => t.isActive || isAdmin || (currentUser && t.createdBy === currentUser.id)
    );
  }, [levelTests, isAdmin, currentUser]);

  // Cascading dropdown options for Subject -> Topic -> Subtopic filters
  const availableTopicsForFilter = useMemo(() => {
    if (subjectFilter === 'all') {
      return subjects.flatMap((s) =>
        s.topics.map((t) => ({ id: t.id, title: `${s.shortCode} · ${t.title}`, subjectId: s.id }))
      );
    }
    const subj = subjects.find((s) => s.id === subjectFilter);
    return (subj?.topics || []).map((t) => ({ id: t.id, title: t.title, subjectId: subj!.id }));
  }, [subjects, subjectFilter]);

  const availableSubtopicsForFilter = useMemo(() => {
    if (topicFilter !== 'all') {
      const targetTopic = subjects
        .flatMap((s) => s.topics)
        .find((t) => t.id === topicFilter);
      if (!targetTopic) return [];
      return targetTopic.subtopics.map((name, idx) => ({
        id: targetTopic.subtopicItems?.[idx]?.id || `${targetTopic.id}::sub_${idx}`,
        name,
      }));
    }
    const scopedSubjects =
      subjectFilter === 'all' ? subjects : subjects.filter((s) => s.id === subjectFilter);
    return scopedSubjects.flatMap((s) =>
      s.topics.flatMap((t) =>
        t.subtopics.map((name, idx) => ({
          id: t.subtopicItems?.[idx]?.id || `${t.id}::sub_${idx}`,
          name: `${t.title} › ${name}`,
        }))
      )
    );
  }, [subjects, subjectFilter, topicFilter]);

  // Enriched rows for rendering & filtering
  const enrichedRows = useMemo(() => {
    return accessibleTests.map((test) => {
      const hierarchy = resolveTestHierarchy(test);
      const attempts = attemptsByTest.get(test.id) || [];
      const latestAttempt = attempts[0] || null;
      const bestAttempt = attempts.length
        ? attempts.reduce((best, cur) => (cur.percentage > best.percentage ? cur : best), attempts[0])
        : null;
      const isAttempted = attempts.length > 0;
      const isMine = Boolean(currentUser && test.createdBy === currentUser.id);
      const creatorLabel =
        test.creatorName || (isMine ? currentUser?.fullName || 'You' : 'Portal Member');

      return {
        test,
        hierarchy,
        attempts,
        latestAttempt,
        bestAttempt,
        isAttempted,
        isMine,
        creatorLabel,
      };
    });
  }, [accessibleTests, hierarchyIndex, attemptsByTest, currentUser]);

  // Apply all filters
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRows.filter((row) => {
      if (subjectFilter !== 'all' && row.test.subjectId !== subjectFilter) return false;
      if (topicFilter !== 'all' && row.test.topicId !== topicFilter) return false;
      if (subtopicFilter !== 'all' && row.test.subtopicId !== subtopicFilter) return false;
      if (levelFilter !== 'all' && row.test.entityType !== levelFilter) return false;
      if (attemptStatusFilter === 'attempted' && !row.isAttempted) return false;
      if (attemptStatusFilter === 'not_attempted' && row.isAttempted) return false;

      if (q) {
        const haystack = [
          row.test.title,
          row.test.description,
          row.creatorLabel,
          row.hierarchy.subjectName,
          row.hierarchy.subjectCode,
          row.hierarchy.topicTitle || '',
          row.hierarchy.subtopicName || '',
          row.test.entityType,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    enrichedRows,
    searchQuery,
    subjectFilter,
    topicFilter,
    subtopicFilter,
    levelFilter,
    attemptStatusFilter,
  ]);

  // KPI Metrics across all accessible tests
  const stats = useMemo(() => {
    const total = enrichedRows.length;
    const attemptedRows = enrichedRows.filter((r) => r.isAttempted);
    const attemptedCount = attemptedRows.length;
    const pendingCount = total - attemptedCount;
    const avgPct =
      attemptedCount > 0
        ? Math.round(
            (attemptedRows.reduce((sum, r) => sum + (r.latestAttempt?.percentage || 0), 0) /
              attemptedCount) *
              10
          ) / 10
        : 0;
    return { total, attemptedCount, pendingCount, avgPct };
  }, [enrichedRows]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    subjectFilter !== 'all' ||
    topicFilter !== 'all' ||
    subtopicFilter !== 'all' ||
    levelFilter !== 'all' ||
    attemptStatusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSubjectFilter('all');
    setTopicFilter('all');
    setSubtopicFilter('all');
    setLevelFilter('all');
    setAttemptStatusFilter('all');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <header className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Tests &amp; Assessments Hub
              </h1>
              <p className="text-xs text-slate-500">
                Browse all Subject, Topic, and Subtopic tests in one place, track attempted vs.
                pending status, and inspect per-test correct/wrong results.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refreshNotesAndTests()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${notesTestsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setActiveView('ContentStudio')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold whitespace-nowrap shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create / Import Test
            <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono text-[10px] font-bold">
              +25
            </span>
          </button>
        </div>
      </header>

      {/* Summary KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Tests
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all subjects &amp; levels</div>
        </div>

        <button
          type="button"
          onClick={() =>
            setAttemptStatusFilter(attemptStatusFilter === 'attempted' ? 'all' : 'attempted')
          }
          className={`text-left bg-white border rounded-xl p-4 transition-colors ${
            attemptStatusFilter === 'attempted'
              ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Attempted
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {stats.attemptedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Click to filter completed tests</div>
        </button>

        <button
          type="button"
          onClick={() =>
            setAttemptStatusFilter(
              attemptStatusFilter === 'not_attempted' ? 'all' : 'not_attempted'
            )
          }
          className={`text-left bg-white border rounded-xl p-4 transition-colors ${
            attemptStatusFilter === 'not_attempted'
              ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/30'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <CircleDashed className="w-3.5 h-3.5" />
            Not Attempted
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {stats.pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Click to filter pending tests</div>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Avg. Accuracy
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
            {stats.attemptedCount > 0 ? `${stats.avgPct}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Based on latest attempts</div>
        </div>
      </section>

      {/* Cascading Subject / Topic / Subtopic + Status Filter Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Tests by Hierarchy &amp; Status</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>

        {/* Row 1: Search + Subject / Topic / Subtopic dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test title or creator..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setTopicFilter('all');
              setSubtopicFilter('all');
            }}
            aria-label="Filter by Subject"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shortCode} — {s.name}
              </option>
            ))}
          </select>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value);
              setSubtopicFilter('all');
            }}
            aria-label="Filter by Topic"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Topics ({availableTopicsForFilter.length})</option>
            {availableTopicsForFilter.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Subtopic Filter */}
          <select
            value={subtopicFilter}
            onChange={(e) => setSubtopicFilter(e.target.value)}
            aria-label="Filter by Subtopic"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subtopics ({availableSubtopicsForFilter.length})</option>
            {availableSubtopicsForFilter.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Level & Attempt Status Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Level:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'subject', label: 'Subject' },
                  { id: 'topic', label: 'Topic' },
                  { id: 'subtopic', label: 'Subtopic' },
                ] as Array<{ id: LevelFilter; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLevelFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    levelFilter === opt.id
                      ? 'bg-indigo-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Attempt Status:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(
                [
                  { id: 'all', label: 'All Tests' },
                  { id: 'not_attempted', label: 'Not Attempted' },
                  { id: 'attempted', label: 'Attempted' },
                ] as Array<{ id: AttemptStatusFilter; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAttemptStatusFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    attemptStatusFilter === opt.id
                      ? opt.id === 'attempted'
                        ? 'bg-emerald-600 text-white'
                        : opt.id === 'not_attempted'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Tests Data Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Tests Directory ({filteredRows.length} of {enrichedRows.length})
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Green highlight = Attempted • Amber badge = Pending
          </span>
        </div>

        {notesTestsLoading && enrichedRows.length === 0 ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {enrichedRows.length === 0
                  ? 'No tests have been created yet'
                  : 'No tests match your selected filters'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {enrichedRows.length === 0
                  ? 'Create a Subject, Topic, or Subtopic test and import MCQ questions via CSV or Excel in Notes & Tests Studio.'
                  : 'Try clearing one or more Subject, Topic, Subtopic, or Status filters to see available tests.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveView('ContentStudio')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Test
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 font-bold">Test &amp; Hierarchy</th>
                  <th className="text-left px-4 py-3 font-bold whitespace-nowrap">Created By</th>
                  <th className="text-left px-4 py-3 font-bold whitespace-nowrap">Created On</th>
                  <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Duration</th>
                  <th className="text-left px-4 py-3 font-bold whitespace-nowrap">
                    Your Result (Right / Wrong)
                  </th>
                  <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const { test, hierarchy, attempts, latestAttempt, isAttempted, isMine, creatorLabel } =
                    row;
                  const breakdown = latestAttempt ? getAttemptBreakdown(latestAttempt) : null;
                  const passed = latestAttempt
                    ? latestAttempt.percentage >= test.passingPercentage
                    : false;

                  return (
                    <tr
                      key={test.id}
                      className={`transition-colors ${
                        isAttempted
                          ? 'bg-emerald-50/25 hover:bg-emerald-50/50 border-l-4 border-l-emerald-500'
                          : 'bg-white hover:bg-slate-50 border-l-4 border-l-amber-400'
                      }`}
                    >
                      {/* Column 1: Attempt Status (Unmistakable Visual Distinction) */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        {isAttempted ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              Attempted
                            </span>
                            <div className="text-[10px] font-mono text-emerald-700 font-semibold pl-0.5">
                              {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                            <CircleDashed className="w-3.5 h-3.5 text-amber-600" />
                            Not Attempted
                          </span>
                        )}
                      </td>

                      {/* Column 2: Test Title + Exact Level & Hierarchy Breadcrumb */}
                      <td className="px-4 py-3.5 align-top min-w-[260px] max-w-[360px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                              test.entityType === 'subject'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : test.entityType === 'topic'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {test.entityType}
                          </span>
                          {!test.isActive && (
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              DRAFT
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900">{test.title}</span>
                        </div>

                        {/* Clear Hierarchy Trail */}
                        <div className="mt-1.5 flex items-center flex-wrap gap-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">
                            {hierarchy.subjectCode} · {hierarchy.subjectName}
                          </span>
                          {hierarchy.topicTitle && (
                            <>
                              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="text-slate-600">{hierarchy.topicTitle}</span>
                            </>
                          )}
                          {hierarchy.subtopicName && (
                            <>
                              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="text-purple-700 font-medium">
                                {hierarchy.subtopicName}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Created By */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{creatorLabel}</span>
                          {isMine && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Created Date */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateShort(test.createdAt)}</span>
                        </div>
                      </td>

                      {/* Column 5: Duration & Questions */}
                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap font-mono tabular-nums">
                        <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{test.durationMinutes} min</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {test.questionCount ?? 0} Questions
                        </div>
                      </td>

                      {/* Column 6: Particular Test Result (Correct / Wrong / Skipped / %) */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        {latestAttempt && breakdown ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                {breakdown.correct} Right
                              </span>
                              <span className="inline-flex items-center gap-0.5 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                <XCircle className="w-3 h-3" />
                                {breakdown.wrong} Wrong
                              </span>
                              {breakdown.skipped > 0 && (
                                <span className="text-slate-500 text-[10px]">
                                  {breakdown.skipped} Skip
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-mono tabular-nums font-bold text-indigo-700">
                                {latestAttempt.percentage}%
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                  passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {passed ? 'PASSED' : 'NEEDS REVISION'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 italic block">
                              No attempt recorded yet
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <Coins className="w-3 h-3 text-amber-600" />
                              Earn up to +45 Coins
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isAttempted && latestAttempt ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setModalState({
                                    test,
                                    breadcrumbs: hierarchy.breadcrumbs,
                                    initialReviewAttempt: latestAttempt,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Result
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setModalState({
                                    test,
                                    breadcrumbs: hierarchy.breadcrumbs,
                                    initialReviewAttempt: null,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                                title="Retake this test"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Retake
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setModalState({
                                  test,
                                  breadcrumbs: hierarchy.breadcrumbs,
                                  initialReviewAttempt: null,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              Attempt Test
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Timed Test Runner & Per-Test Result Review Modal */}
      <TestRunnerModal
        isOpen={Boolean(modalState)}
        onClose={() => setModalState(null)}
        test={modalState?.test || null}
        breadcrumbs={modalState?.breadcrumbs || []}
        initialReviewAttempt={modalState?.initialReviewAttempt || null}
      />
    </div>
  );
};
