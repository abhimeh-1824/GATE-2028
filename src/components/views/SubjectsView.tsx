import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Star,
  BookMarked,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Sigma,
  HelpCircle,
  Database,
  UploadCloud,
  RefreshCw,
  Server,
  Layers,
  Video,
  FileText,
  Plus,
  Play,
  ExternalLink,
  Award,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  ChevronRight,
  Home,
  ArrowLeft,
  Zap,
  ClipboardCheck,
  Settings2,
  FolderOpen,
  GraduationCap,
  Search,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  SubjectId,
  TopicStatus,
  StudyResource,
  StudyNote,
  LevelTest,
  NoteType,
} from '../../types';
import {
  DEFAULT_SUBJECT_RESOURCES,
  DEFAULT_TOPIC_RESOURCES,
  loadCustomResources,
  saveCustomResourceToCloud,
  deleteCustomResourceFromCloud,
} from '../../data/subjectResources';
import { ResourceViewerModal } from '../modals/ResourceViewerModal';
import { AddResourceModal } from '../modals/AddResourceModal';
import { SyllabusEntryModal, SyllabusEntryTarget } from '../modals/SyllabusEntryModal';
import { HtmlNotesViewerModal } from '../modals/HtmlNotesViewerModal';
import { TestRunnerModal } from '../modals/TestRunnerModal';
import { getDeterministicUuid } from '../../lib/supabaseService';

// ─── Types ──────────────────────────────────────────────────────────────────
type DrillLevel = 'subjects' | 'topics' | 'subtopics';

interface SubjectsViewProps {
  initialSubjectId?: SubjectId;
  onOpenFormulaVault: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const statusConfig: Record<TopicStatus, { icon: React.FC<{ className?: string }>; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Mastered' },
  in_progress: { icon: Clock, color: 'text-amber-500', label: 'In Progress' },
  revision_due: { icon: AlertTriangle, color: 'text-orange-500', label: 'Revision Due' },
  unvisited: { icon: Circle, color: 'text-slate-300', label: 'Unvisited' },
};

// ─── Component ──────────────────────────────────────────────────────────────
export const SubjectsView: React.FC<SubjectsViewProps> = ({
  initialSubjectId,
  onOpenFormulaVault,
}) => {
  const {
    subjects,
    currentUser,
    updateTopicStatus,
    updateTopicConfidence,
    dbStats,
    addSubject,
    addTopic,
    addSubtopic,
    setIsAuthModalOpen,
    setActiveView,
    studyNotes,
    levelTests,
    testAttempts,
  } = useStudy();

  // ── Drill-down navigation state ──
  const [drillLevel, setDrillLevel] = useState<DrillLevel>(initialSubjectId ? 'topics' : 'subjects');
  const [activeSubjectId, setActiveSubjectId] = useState<SubjectId>(initialSubjectId || '');
  const [activeTopicId, setActiveTopicId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal states (preserved from original) ──
  const [entryTarget, setEntryTarget] = useState<SyllabusEntryTarget | null>(null);
  const [notesViewerState, setNotesViewerState] = useState<{
    isOpen: boolean;
    breadcrumbs: string[];
    completeNote: StudyNote | null;
    shortNote: StudyNote | null;
    initialNoteType: NoteType;
  }>({
    isOpen: false,
    breadcrumbs: [],
    completeNote: null,
    shortNote: null,
    initialNoteType: 'complete',
  });
  const [activeTestModal, setActiveTestModal] = useState<{
    test: LevelTest;
    breadcrumbs: string[];
  } | null>(null);
  const [selectedResource, setSelectedResource] = useState<StudyResource | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [addResourceTargetTopicId, setAddResourceTargetTopicId] = useState<string | undefined>(undefined);
  const [addResourceTargetSubtopic, setAddResourceTargetSubtopic] = useState<string | undefined>(undefined);
  const [resourceFormatFilter, setResourceFormatFilter] = useState<'all' | 'books' | 'videos'>('all');

  // ── Custom Resources ──
  const userId = currentUser?.id || 'guest_user';
  const [customResourcesMap, setCustomResourcesMap] = useState<Record<string, StudyResource[]>>({});

  useEffect(() => {
    if (!currentUser) {
      setCustomResourcesMap({});
      return;
    }
    void loadCustomResources(currentUser.id).then(setCustomResourcesMap);
  }, [currentUser?.id]);

  // ── Computed values ──
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || null;
  const activeTopic = activeSubject?.topics.find((t) => t.id === activeTopicId) || null;

  const canManageSyllabus = Boolean(
    currentUser &&
    !currentUser.id.startsWith('demo_') &&
    !currentUser.id.startsWith('guest_') &&
    !currentUser.id.includes('aspirant')
  );

  // ── Notes & Tests lookups ──
  const getLevelNotes = (entityType: 'subject' | 'topic' | 'subtopic', entityId: string) => ({
    completeNote:
      studyNotes.find(
        (n) => n.entityType === entityType && n.entityId === entityId && n.noteType === 'complete'
      ) || null,
    shortNote:
      studyNotes.find(
        (n) => n.entityType === entityType && n.entityId === entityId && n.noteType === 'short'
      ) || null,
  });

  const getLevelTests = (entityType: 'subject' | 'topic' | 'subtopic', entityId: string) =>
    levelTests.filter((t) => t.entityType === entityType && t.entityId === entityId);

  const getBestScore = (testId: string): number | null => {
    const relevant = testAttempts.filter((a) => a.testId === testId);
    if (!relevant.length) return null;
    return Math.max(...relevant.map((a) => a.percentage));
  };

  const openNotesModal = (
    entityType: 'subject' | 'topic' | 'subtopic',
    entityId: string,
    breadcrumbs: string[],
    initialNoteType: NoteType
  ) => {
    const { completeNote, shortNote } = getLevelNotes(entityType, entityId);
    setNotesViewerState({
      isOpen: true,
      breadcrumbs,
      completeNote,
      shortNote,
      initialNoteType,
    });
  };

  // ── Resource handlers (preserved) ──
  const handleSaveResource = async (targetId: string, resource: StudyResource) => {
    if (!currentUser) return;
    const saved = await saveCustomResourceToCloud(currentUser.id, targetId, resource);
    if (saved) {
      setCustomResourcesMap((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), resource],
      }));
    }
  };

  const handleDeleteCustomResource = async (targetId: string, resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const deleted = await deleteCustomResourceFromCloud(currentUser.id, targetId, resourceId);
    if (deleted) {
      setCustomResourcesMap((prev) => ({
        ...prev,
        [targetId]: (prev[targetId] || []).filter((resource) => resource.id !== resourceId),
      }));
    }
  };

  // ── Syllabus entry ──
  const openSyllabusEntry = (target: SyllabusEntryTarget) => {
    if (!canManageSyllabus) {
      setIsAuthModalOpen(true);
      return;
    }
    setEntryTarget(target);
  };

  // ── Navigation helpers ──
  const drillIntoSubject = (subjectId: SubjectId) => {
    setActiveSubjectId(subjectId);
    setActiveTopicId('');
    setDrillLevel('topics');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const drillIntoTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setDrillLevel('subtopics');
    setSearchQuery('');
  };

  const goBack = () => {
    setSearchQuery('');
    if (drillLevel === 'subtopics') {
      setActiveTopicId('');
      setDrillLevel('topics');
    } else if (drillLevel === 'topics') {
      setActiveSubjectId('');
      setDrillLevel('subjects');
    }
  };

  // ── Breadcrumbs ──
  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; onClick?: () => void }[] = [
      {
        label: 'All Subjects',
        onClick: drillLevel !== 'subjects' ? () => {
          setActiveSubjectId('');
          setActiveTopicId('');
          setDrillLevel('subjects');
        } : undefined,
      },
    ];
    if (activeSubject && drillLevel !== 'subjects') {
      crumbs.push({
        label: activeSubject.name,
        onClick: drillLevel !== 'topics' ? () => {
          setActiveTopicId('');
          setDrillLevel('topics');
        } : undefined,
      });
    }
    if (activeTopic && drillLevel === 'subtopics') {
      crumbs.push({ label: activeTopic.title });
    }
    return crumbs;
  }, [drillLevel, activeSubject, activeTopic]);

  // ── Content-status pill renderer ──
  const ContentPills: React.FC<{
    entityType: 'subject' | 'topic' | 'subtopic';
    entityId: string;
    entityLabel: string;
    parentBreadcrumbs: string[];
  }> = ({ entityType, entityId, entityLabel, parentBreadcrumbs }) => {
    const { completeNote, shortNote } = getLevelNotes(entityType, entityId);
    const tests = getLevelTests(entityType, entityId).filter((t) => t.isActive);
    const bc = [...parentBreadcrumbs, entityLabel];

    return (
      <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {/* Complete Notes */}
        <button
          onClick={() => completeNote && openNotesModal(entityType, entityId, bc, 'complete')}
          disabled={!completeNote}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
            completeNote
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer'
              : 'bg-slate-50 text-slate-350 border-slate-150 cursor-default opacity-50'
          }`}
          title={completeNote ? 'Open Complete Notes' : 'Complete Notes not uploaded'}
        >
          <FileText className="w-3 h-3" />
          <span>Notes</span>
          {completeNote && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </button>

        {/* Short Notes */}
        <button
          onClick={() => shortNote && openNotesModal(entityType, entityId, bc, 'short')}
          disabled={!shortNote}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
            shortNote
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
              : 'bg-slate-50 text-slate-350 border-slate-150 cursor-default opacity-50'
          }`}
          title={shortNote ? 'Open Short Notes' : 'Short Notes not uploaded'}
        >
          <Zap className="w-3 h-3" />
          <span>Quick</span>
          {shortNote && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </button>

        {/* Tests */}
        {tests.length > 0 ? (
          tests.map((t) => {
            const best = getBestScore(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setActiveTestModal({ test: t, breadcrumbs: bc })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                title={`Take test: ${t.title}`}
              >
                <ClipboardCheck className="w-3 h-3" />
                <span>Test</span>
                {best !== null && (
                  <span className="font-mono font-bold">{best}%</span>
                )}
                {best === null && <Play className="w-3 h-3" />}
              </button>
            );
          })
        ) : (
          <span className="text-[10px] text-slate-300 font-mono">No test</span>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPTY STATE — no subjects yet
  // ═══════════════════════════════════════════════════════════════════════════
  if (subjects.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900">Build your syllabus</h1>
              <p className="text-sm text-slate-600 mt-1">
                No subjects yet. Add a subject, then create its topics and subtopics here.
              </p>
              <button
                onClick={() => openSyllabusEntry({ kind: 'subject' })}
                className="mt-4 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add your first subject
              </button>
              {!canManageSyllabus && (
                <p className="text-xs text-amber-700 mt-2">
                  Sign in with a Supabase account to save syllabus entries.
                </p>
              )}
            </div>
          </div>
        </section>
        <SyllabusEntryModal
          target={entryTarget}
          onClose={() => setEntryTarget(null)}
          onAddSubject={addSubject}
          onAddTopic={addTopic}
          onAddSubtopic={addSubtopic}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — drill-down hierarchy
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3 pb-12">

      {/* ── Compact Toolbar: Breadcrumb + Search + Actions ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Left: Back + Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs min-w-0 shrink-0">
          {drillLevel !== 'subjects' && (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold mr-0.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="font-semibold text-slate-500 hover:text-indigo-700 transition-colors truncate max-w-[160px]"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-bold text-indigo-700 truncate max-w-[180px]">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Center: Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              drillLevel === 'subjects' ? 'Search subjects…'
              : drillLevel === 'topics' ? 'Search topics…'
              : 'Search subtopics…'
            }
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 transition-colors"
          />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          LEVEL 1 — ALL SUBJECTS (Tabular Overview)
          ═════════════════════════════════════════════════════════════════════ */}
      {drillLevel === 'subjects' && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_200px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Subject</span>
            <span className="text-center">Progress</span>
            <span className="text-center">Topics</span>
            <span>Notes & Tests</span>
          </div>

          {/* Subject Rows */}
          <div className="divide-y divide-slate-100">
            {subjects.filter((sub) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return sub.name.toLowerCase().includes(q) || sub.shortCode.toLowerCase().includes(q);
            }).map((sub) => {
              const completedTopics = sub.topics.filter((t) => t.status === 'completed').length;
              const totalTopics = sub.topics.length;
              const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

              return (
                <div
                  key={sub.id}
                  className="group cursor-pointer hover:bg-indigo-50/40 transition-colors"
                  onClick={() => drillIntoSubject(sub.id)}
                >
                  <div className="sm:grid sm:grid-cols-[1fr_120px_120px_200px] gap-3 px-5 py-3.5 items-center">
                    {/* Subject Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {sub.shortCode}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                            {sub.name}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[300px]">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="text-center mt-2 sm:mt-0">
                      <div className="text-sm font-bold text-indigo-700 font-mono">{pct}%</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 mx-auto max-w-[80px]">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Topics Count */}
                    <div className="text-center mt-2 sm:mt-0">
                      <span className="text-xs font-mono text-slate-600">
                        <strong className="text-emerald-600">{completedTopics}</strong>
                        <span className="text-slate-400"> / {totalTopics}</span>
                      </span>
                    </div>

                    {/* Notes & Tests Indicators */}
                    <div className="mt-2 sm:mt-0">
                      <ContentPills
                        entityType="subject"
                        entityId={sub.id}
                        entityLabel={sub.name}
                        parentBreadcrumbs={[]}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          LEVEL 2 — TOPICS WITHIN A SUBJECT
          ═════════════════════════════════════════════════════════════════════ */}
      {drillLevel === 'topics' && activeSubject && (() => {
        const completedCount = activeSubject.topics.filter((t) => t.status === 'completed').length;
        const totalCount = activeSubject.topics.length;
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const filteredTopics = activeSubject.topics.filter((t) => {
          const statusMatch = statusFilter === 'all' || t.status === statusFilter;
          const searchMatch = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase());
          return statusMatch && searchMatch;
        });

        // Resources for this subject
        const defaults = DEFAULT_SUBJECT_RESOURCES[activeSubject.id] || [];
        const customs = customResourcesMap[activeSubject.id] || [];
        const allResources = [...defaults, ...customs];
        const booksCount = allResources.filter((r) => r.type === 'book_pdf').length;
        const videosCount = allResources.filter((r) => r.type === 'video_tutorial').length;
        const filteredResources = resourceFormatFilter === 'books'
          ? allResources.filter((r) => r.type === 'book_pdf')
          : resourceFormatFilter === 'videos'
          ? allResources.filter((r) => r.type === 'video_tutorial')
          : allResources;

        return (
          <>
            {/* Resources section (collapsible) */}
            {allResources.length > 0 && (
              <ResourcesSection
                resources={filteredResources}
                booksCount={booksCount}
                videosCount={videosCount}
                resourceFormatFilter={resourceFormatFilter}
                setResourceFormatFilter={setResourceFormatFilter}
                activeSubject={activeSubject}
                onSelectResource={setSelectedResource}
                onAddResource={() => {
                  setAddResourceTargetTopicId(undefined);
                  setAddResourceTargetSubtopic(undefined);
                  setIsAddResourceOpen(true);
                }}
                onDeleteResource={handleDeleteCustomResource}
              />
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
              {[
                { id: 'all', label: 'All Topics' },
                { id: 'completed', label: 'Mastered' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'revision_due', label: 'Revision Due' },
                { id: 'unvisited', label: 'Unvisited' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    statusFilter === f.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Topics Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-[auto_1fr_100px_100px_60px_200px] gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <span className="w-5" />
                <span>Topic</span>
                <span className="text-center">Status</span>
                <span className="text-center">Subtopics</span>
                <span className="text-center">★</span>
                <span>Notes & Tests</span>
              </div>

              {/* Topic Rows */}
              <div className="divide-y divide-slate-100">
                {filteredTopics.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    No topics match the selected filter.
                  </div>
                ) : (
                  filteredTopics.map((topic) => {
                    const sc = statusConfig[topic.status];
                    const StatusIcon = sc.icon;

                    return (
                      <div
                        key={topic.id}
                        className="group cursor-pointer hover:bg-indigo-50/40 transition-colors"
                        onClick={() => drillIntoTopic(topic.id)}
                      >
                        <div className="sm:grid sm:grid-cols-[auto_1fr_100px_100px_60px_200px] gap-2 px-5 py-3 items-center">
                          {/* Status Icon (clickable to cycle) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatus: TopicStatus =
                                topic.status === 'completed'
                                  ? 'revision_due'
                                  : topic.status === 'revision_due'
                                  ? 'in_progress'
                                  : 'completed';
                              updateTopicStatus(activeSubject.id, topic.id, nextStatus);
                            }}
                            title="Click to cycle status"
                            className="shrink-0"
                          >
                            <StatusIcon className={`w-5 h-5 ${sc.color}`} />
                          </button>

                          {/* Topic Name */}
                          <div className="min-w-0 mt-1 sm:mt-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                                {topic.title}
                              </h3>
                              <span className="text-[9px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                {topic.weightageTier}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              PYQs: {topic.pyqsSolved}/{topic.pyqsTotal} ({topic.pyqAccuracy}% acc)
                            </div>
                          </div>

                          {/* Status label */}
                          <div className="text-center mt-1 sm:mt-0">
                            <span className={`text-[10px] font-bold font-mono ${sc.color}`}>
                              {sc.label}
                            </span>
                          </div>

                          {/* Subtopics count */}
                          <div className="text-center mt-1 sm:mt-0">
                            <span className="text-xs font-mono text-slate-600 flex items-center justify-center gap-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              {topic.subtopics?.length || 0}
                            </span>
                          </div>

                          {/* Confidence stars */}
                          <div className="flex items-center justify-center gap-0.5 mt-1 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => updateTopicConfidence(activeSubject.id, topic.id, star)}
                                className="hover:scale-125 transition-transform"
                                title={`Confidence: ${star}/5`}
                              >
                                <Star className={`w-3 h-3 ${star <= topic.confidenceScore ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                              </button>
                            ))}
                          </div>

                          {/* Notes & Tests */}
                          <div className="mt-2 sm:mt-0">
                            <ContentPills
                              entityType="topic"
                              entityId={topic.id}
                              entityLabel={topic.title}
                              parentBreadcrumbs={[activeSubject.name]}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        );
      })()}

      {/* ═════════════════════════════════════════════════════════════════════
          LEVEL 3 — SUBTOPICS WITHIN A TOPIC
          ═════════════════════════════════════════════════════════════════════ */}
      {drillLevel === 'subtopics' && activeSubject && activeTopic && (() => {
        const topicDefaultRes = DEFAULT_TOPIC_RESOURCES[activeTopic.id] || [];
        const topicCustomRes = customResourcesMap[activeTopic.id] || [];
        const allTopicResources = [...topicDefaultRes, ...topicCustomRes];
        const sc = statusConfig[activeTopic.status];
        const StatusIcon = sc.icon;

        return (
          <>
            {/* Topic Resources */}
            {allTopicResources.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  <span>Video Lectures & PDFs</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allTopicResources.map((res) => {
                    const isVid = res.type === 'video_tutorial';
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResource(res)}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              isVid ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {isVid ? 'Video' : 'PDF'}
                            </span>
                            {res.subtopicTitle && (
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                                · {res.subtopicTitle}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {res.title}
                          </h5>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {res.authorOrChannel} · {res.durationOrPages}
                          </div>
                        </div>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isVid
                            ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                            : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                        } transition-colors`}>
                          {isVid ? <Play className="w-3.5 h-3.5 fill-current" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Subtopics Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[1fr_200px_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <span>Subtopic</span>
                <span>Notes & Tests</span>
                <span className="text-center">Resources</span>
              </div>

              <div className="divide-y divide-slate-100">
                {(!activeTopic.subtopics || activeTopic.subtopics.length === 0) ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    No subtopics yet. Click "Add Subtopic" to get started.
                  </div>
                ) : (
                  activeTopic.subtopics
                    .map((sub, idx) => ({ sub, idx }))
                    .filter(({ sub }) => !searchQuery.trim() || sub.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(({ sub, idx }) => {
                    const candidateSubtopicId = activeTopic.subtopicItems?.[idx]?.id;
                    const subtopicId = candidateSubtopicId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateSubtopicId)
                      ? candidateSubtopicId
                      : getDeterministicUuid(`subtop_${activeTopic.id}_${idx}`);

                    const matchingResource = allTopicResources.find(
                      (r) => r.subtopicTitle?.toLowerCase() === sub.toLowerCase()
                    );

                    return (
                      <div
                        key={idx}
                        className="sm:grid sm:grid-cols-[1fr_200px_120px] gap-3 px-5 py-3 items-center hover:bg-indigo-50/30 transition-colors"
                      >
                        {/* Subtopic name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-800 truncate">{sub}</span>
                        </div>

                        {/* Notes & Tests */}
                        <div className="mt-2 sm:mt-0">
                          <ContentPills
                            entityType="subtopic"
                            entityId={subtopicId}
                            entityLabel={sub}
                            parentBreadcrumbs={[activeSubject.name, activeTopic.title]}
                          />
                        </div>

                        {/* Resource quick action */}
                        <div className="text-center mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                          {matchingResource ? (
                            <button
                              onClick={() => setSelectedResource(matchingResource)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-colors"
                            >
                              {matchingResource.type === 'video_tutorial' ? (
                                <Play className="w-3 h-3 fill-indigo-700" />
                              ) : (
                                <BookOpen className="w-3 h-3" />
                              )}
                              <span>{matchingResource.type === 'video_tutorial' ? 'Watch' : 'PDF'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setAddResourceTargetTopicId(activeTopic.id);
                                setAddResourceTargetSubtopic(sub);
                                setIsAddResourceOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 text-[10px] font-semibold transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Formulas & Traps (preserved) */}
            {activeTopic.formulas.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sigma className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Core Formulas & Theorems</span>
                </h4>
                <div className="space-y-2.5">
                  {activeTopic.formulas.map((form) => (
                    <div key={form.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{form.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{form.tag}</span>
                      </div>
                      <div className="p-2 bg-slate-900 text-emerald-300 font-mono text-xs rounded overflow-x-auto">
                        <code>{form.latex}</code>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">{form.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTopic.commonTraps.length > 0 && (
              <section className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Dangerous GATE Traps & Misconceptions</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                  {activeTopic.commonTraps.map((trap, idx) => (
                    <li key={idx} className="leading-relaxed">{trap}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      })()}

      {/* ═══════ Modals (preserved from original) ═══════ */}
      <ResourceViewerModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
      />

      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => {
          setIsAddResourceOpen(false);
          setAddResourceTargetTopicId(undefined);
          setAddResourceTargetSubtopic(undefined);
        }}
        subjects={subjects}
        defaultSubjectId={activeSubject?.id || ''}
        defaultTopicId={addResourceTargetTopicId}
        defaultSubtopicTitle={addResourceTargetSubtopic}
        onSaveResource={handleSaveResource}
      />

      <HtmlNotesViewerModal
        isOpen={notesViewerState.isOpen}
        onClose={() => setNotesViewerState((prev) => ({ ...prev, isOpen: false }))}
        breadcrumbs={notesViewerState.breadcrumbs}
        completeNote={notesViewerState.completeNote}
        shortNote={notesViewerState.shortNote}
        initialNoteType={notesViewerState.initialNoteType}
      />

      <TestRunnerModal
        isOpen={Boolean(activeTestModal)}
        onClose={() => setActiveTestModal(null)}
        test={activeTestModal?.test || null}
        breadcrumbs={activeTestModal?.breadcrumbs || []}
      />

      <SyllabusEntryModal
        target={entryTarget}
        onClose={() => setEntryTarget(null)}
        onAddSubject={addSubject}
        onAddTopic={addTopic}
        onAddSubtopic={addSubtopic}
      />
    </div>
  );
};

// ─── Resources Section Component (extracted for cleanliness) ────────────────
const ResourcesSection: React.FC<{
  resources: StudyResource[];
  booksCount: number;
  videosCount: number;
  resourceFormatFilter: 'all' | 'books' | 'videos';
  setResourceFormatFilter: (f: 'all' | 'books' | 'videos') => void;
  activeSubject: { id: string; name: string; shortCode: string };
  onSelectResource: (r: StudyResource) => void;
  onAddResource: () => void;
  onDeleteResource: (targetId: string, resourceId: string, e: React.MouseEvent) => void;
}> = ({
  resources,
  booksCount,
  videosCount,
  resourceFormatFilter,
  setResourceFormatFilter,
  activeSubject,
  onSelectResource,
  onAddResource,
  onDeleteResource,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-700" />
          <span className="text-sm font-bold text-slate-900">
            Study Resources
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {booksCount + videosCount} items
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 pt-0 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setResourceFormatFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  resourceFormatFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({booksCount + videosCount})
              </button>
              <button
                onClick={() => setResourceFormatFilter('books')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  resourceFormatFilter === 'books' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3 h-3 text-indigo-600" />
                Books ({booksCount})
              </button>
              <button
                onClick={() => setResourceFormatFilter('videos')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  resourceFormatFilter === 'videos' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="w-3 h-3 text-rose-600" />
                Videos ({videosCount})
              </button>
            </div>

            <button
              onClick={onAddResource}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add PDF / Video
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map((res) => {
              const isVideo = res.type === 'video_tutorial';
              const isCustom = !res.isStandardReference;
              return (
                <div
                  key={res.id}
                  onClick={() => onSelectResource(res)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between hover:shadow-xs group ${
                    isVideo
                      ? 'bg-rose-50/20 border-rose-100 hover:border-rose-300'
                      : 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isVideo ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isVideo ? <Video className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        <span>{isVideo ? 'Video' : 'Book PDF'}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {res.isStandardReference && (
                          <span title="GATE Standard" className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5" />
                            Std
                          </span>
                        )}
                        {isCustom && (
                          <button
                            onClick={(e) => onDeleteResource(activeSubject.id, res.id, e)}
                            title="Delete custom link"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{res.title}</h3>
                    <div className="text-[11px] text-slate-500 font-medium truncate">{res.authorOrChannel || 'Standard Faculty'}</div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{res.durationOrPages || (isVideo ? 'Lecture' : 'Book')}</span>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      {isVideo ? 'Watch' : 'Read'} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
