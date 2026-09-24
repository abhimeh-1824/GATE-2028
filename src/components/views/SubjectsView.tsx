import React, { useState, useMemo } from 'react';
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
  Trash2
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { SubjectId, TopicStatus, StudyResource } from '../../types';
import {
  DEFAULT_SUBJECT_RESOURCES,
  DEFAULT_TOPIC_RESOURCES,
  getSavedCustomResources,
  saveCustomResource,
  deleteCustomResource,
} from '../../data/subjectResources';
import { ResourceViewerModal } from '../modals/ResourceViewerModal';
import { AddResourceModal } from '../modals/AddResourceModal';

interface SubjectsViewProps {
  initialSubjectId?: SubjectId;
  onOpenFormulaVault: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  initialSubjectId,
  onOpenFormulaVault,
}) => {
  const {
    subjects,
    currentUser,
    updateTopicStatus,
    updateTopicConfidence,
    isDbConnected,
    isSyncingDb,
    dbSyncMessage,
    dbStats,
    syncSyllabusToDb,
    fetchSyllabusFromDb,
  } = useStudy();

  const [activeSubjectId, setActiveSubjectId] = useState<SubjectId>(
    initialSubjectId || 'prob_stat'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Resource Modals State
  const [selectedResource, setSelectedResource] = useState<StudyResource | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [addResourceTargetTopicId, setAddResourceTargetTopicId] = useState<string | undefined>(undefined);
  const [addResourceTargetSubtopic, setAddResourceTargetSubtopic] = useState<string | undefined>(undefined);
  const [resourceFormatFilter, setResourceFormatFilter] = useState<'all' | 'books' | 'videos'>('all');

  // Custom User Resources
  const userId = currentUser?.id || 'guest_user';
  const [customResourcesMap, setCustomResourcesMap] = useState<Record<string, StudyResource[]>>(() =>
    getSavedCustomResources(userId)
  );

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const filteredTopics = activeSubject.topics.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const completedCount = activeSubject.topics.filter((t) => t.status === 'completed').length;
  const totalCount = activeSubject.topics.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Active Subject Resources (Default standard + user custom)
  const activeSubjectResources = useMemo(() => {
    const defaults = DEFAULT_SUBJECT_RESOURCES[activeSubject.id] || [];
    const customs = customResourcesMap[activeSubject.id] || [];
    const combined = [...defaults, ...customs];

    if (resourceFormatFilter === 'books') {
      return combined.filter((r) => r.type === 'book_pdf');
    }
    if (resourceFormatFilter === 'videos') {
      return combined.filter((r) => r.type === 'video_tutorial');
    }
    return combined;
  }, [activeSubject.id, customResourcesMap, resourceFormatFilter]);

  const booksCount = (DEFAULT_SUBJECT_RESOURCES[activeSubject.id] || [])
    .concat(customResourcesMap[activeSubject.id] || [])
    .filter((r) => r.type === 'book_pdf').length;

  const videosCount = (DEFAULT_SUBJECT_RESOURCES[activeSubject.id] || [])
    .concat(customResourcesMap[activeSubject.id] || [])
    .filter((r) => r.type === 'video_tutorial').length;

  // Handler for adding custom resource
  const handleSaveResource = (targetId: string, resource: StudyResource) => {
    const updated = saveCustomResource(userId, targetId, resource);
    setCustomResourcesMap(updated);
  };

  // Handler for deleting custom resource
  const handleDeleteCustomResource = (targetId: string, resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomResource(userId, targetId, resourceId);
    setCustomResourcesMap(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Real Supabase Database Sync Status & Operations Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Supabase Cloud Database
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tables: <strong className="text-slate-700">subjects</strong> ({dbStats.subjectsCount}) · <strong className="text-slate-700">topics</strong> ({dbStats.topicsCount}) · <strong className="text-slate-700">subtopics</strong> ({dbStats.subtopicsCount})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => syncSyllabusToDb()}
              disabled={isSyncingDb}
              title="Save all subjects, topics, and subtopics to Supabase database"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-bounce' : ''}`} />
              <span>Save to Database</span>
            </button>

            <button
              onClick={() => fetchSyllabusFromDb()}
              disabled={isSyncingDb}
              title="Query and fetch real records directly from Supabase database"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
              <span>Fetch Real Data from DB</span>
            </button>
          </div>
        </div>

        {dbSyncMessage && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{dbSyncMessage}</span>
          </div>
        )}
      </section>

      {/* 9 Subjects Horizontal Selector Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subjects.map((sub) => {
            const isActive = sub.id === activeSubjectId;
            const subCompleted = sub.topics.filter((t) => t.status === 'completed').length;
            const subTotal = sub.topics.length;
            const subPct = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

            return (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubjectId(sub.id);
                  setExpandedTopicId(null);
                }}
                className={`px-3 py-2 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{sub.shortCode}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isActive ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    ({subPct}%)
                  </span>
                </div>
                <div
                  className={`text-[11px] truncate max-w-[140px] font-medium ${
                    isActive ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {sub.name}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Subject Header Card */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 font-mono">
              OFFICIAL SYLLABUS MODULE
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-700">
              {activeSubject.weightageMarks}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              ~{activeSubject.approxQuestions} Questions in CBT
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeSubject.name}
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed">
            {activeSubject.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Standard Textbooks:</span>
            {activeSubject.recommendedBooks.map((book, i) => (
              <span
                key={i}
                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
              >
                {book}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Metric Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 min-w-[220px] text-right space-y-2">
          <div className="text-xs text-slate-500">Subject Coverage</div>
          <div className="text-3xl font-extrabold text-indigo-700 font-mono">
            {progressPct}%
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-700 h-full rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {completedCount} of {totalCount} Topics Mastered
          </div>
        </div>
      </section>

      {/* CURATED BOOK PDFs & TUTORIAL VIDEOS SECTION */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Textbook PDFs &amp; Video Lecture Playlists
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {activeSubject.shortCode} Reference Vault
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard GATE DA textbooks, open access PDF chapters, and official video lecture courses.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setResourceFormatFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  resourceFormatFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({booksCount + videosCount})
              </button>
              <button
                onClick={() => setResourceFormatFilter('books')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  resourceFormatFilter === 'books'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>Book PDFs ({booksCount})</span>
              </button>
              <button
                onClick={() => setResourceFormatFilter('videos')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  resourceFormatFilter === 'videos'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="w-3 h-3 text-rose-600" />
                <span>Tutorial Videos ({videosCount})</span>
              </button>
            </div>

            {/* Add Custom Resource Button */}
            <button
              onClick={() => {
                setAddResourceTargetTopicId(undefined);
                setAddResourceTargetSubtopic(undefined);
                setIsAddResourceOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PDF / Video Link</span>
            </button>
          </div>
        </div>

        {/* Resources Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {activeSubjectResources.map((res) => {
            const isVideo = res.type === 'video_tutorial';
            const isCustom = !res.isStandardReference;

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResource(res)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between hover:shadow-xs group ${
                  isVideo
                    ? 'bg-rose-50/20 border-rose-100 hover:border-rose-300'
                    : 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isVideo
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isVideo ? <Video className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      <span>{isVideo ? 'Tutorial Video' : 'Book PDF'}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {res.isStandardReference && (
                        <span
                          title="Authoritative GATE Reference"
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5"
                        >
                          <Award className="w-2.5 h-2.5" />
                          <span>GATE Std</span>
                        </span>
                      )}
                      {isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomResource(activeSubject.id, res.id, e)}
                          title="Delete custom link"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {res.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {res.authorOrChannel || 'Standard Faculty'}
                  </div>

                  {res.description && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{res.durationOrPages || (isVideo ? 'Lecture' : 'Book')}</span>
                  <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    {isVideo ? 'Watch & Notes' : 'Read PDF'} &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filter and Topics Section */}
      <section className="space-y-4">
        {/* Status Filter Tab Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === f.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenFormulaVault}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Sigma className="w-4 h-4" />
            <span>Open Formula Vault &rarr;</span>
          </button>
        </div>

        {/* Topic Accordion Cards */}
        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;

            // Topic-level resources
            const topicDefaultRes = DEFAULT_TOPIC_RESOURCES[topic.id] || [];
            const topicCustomRes = customResourcesMap[topic.id] || [];
            const allTopicResources = [...topicDefaultRes, ...topicCustomRes];

            return (
              <div
                key={topic.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Topic Header Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        const nextStatus: TopicStatus =
                          topic.status === 'completed'
                            ? 'revision_due'
                            : topic.status === 'revision_due'
                            ? 'in_progress'
                            : 'completed';
                        updateTopicStatus(activeSubject.id, topic.id, nextStatus);
                      }}
                      title="Click to cycle status: Mastered -> Revision Due -> In Progress"
                      className="mt-0.5 shrink-0"
                    >
                      {topic.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : topic.status === 'revision_due' ? (
                        <Clock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {topic.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                          {topic.weightageTier}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{topic.subtopics?.length || 0} Subtopics</span>
                        </span>
                        {allTopicResources.length > 0 && (
                          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                            <Video className="w-3 h-3" />
                            <span>{allTopicResources.length} Video/PDF Resources</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>
                          PYQs: {topic.pyqsSolved}/{topic.pyqsTotal} Solved ({topic.pyqAccuracy}% Acc)
                        </span>
                        <span>·</span>
                        <span>
                          Status:{' '}
                          <strong
                            className={
                              topic.status === 'completed'
                                ? 'text-emerald-600'
                                : topic.status === 'revision_due'
                                ? 'text-amber-600'
                                : 'text-slate-600'
                            }
                          >
                            {topic.status.toUpperCase()}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Confidence & Toggle */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    {/* Quick Resources Button */}
                    {allTopicResources.length > 0 && (
                      <button
                        onClick={() => setSelectedResource(allTopicResources[0])}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                        title="Quick launch video or PDF for this topic"
                      >
                        {allTopicResources[0].type === 'video_tutorial' ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          <BookOpen className="w-3 h-3" />
                        )}
                        <span>{allTopicResources[0].type === 'video_tutorial' ? 'Watch Tutorial' : 'Open PDF'}</span>
                      </button>
                    )}

                    {/* Confidence Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateTopicConfidence(activeSubject.id, topic.id, star)}
                          className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                          title={`Confidence: ${star}/5`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              star <= topic.confidenceScore
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Deep Dive'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Deep Dive Panel */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-[#faf8ff] space-y-5 animate-in fade-in duration-150">
                    {/* TOPIC-SPECIFIC BOOK PDFs & TUTORIAL VIDEOS */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-rose-600" />
                          <span>Topic Video Lectures &amp; Chapter PDFs:</span>
                        </h4>
                        <button
                          onClick={() => {
                            setAddResourceTargetTopicId(topic.id);
                            setAddResourceTargetSubtopic(undefined);
                            setIsAddResourceOpen(true);
                          }}
                          className="text-[11px] text-indigo-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Link for this Topic</span>
                        </button>
                      </div>

                      {allTopicResources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {allTopicResources.map((res) => {
                            const isVid = res.type === 'video_tutorial';
                            return (
                              <div
                                key={res.id}
                                onClick={() => setSelectedResource(res)}
                                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex items-start justify-between gap-3 group"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                        isVid
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-indigo-100 text-indigo-800'
                                      }`}
                                    >
                                      {isVid ? 'Video' : 'PDF'}
                                    </span>
                                    {res.subtopicTitle && (
                                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                                        &bull; {res.subtopicTitle}
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {res.title}
                                  </h5>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {res.authorOrChannel} &bull; {res.durationOrPages}
                                  </div>
                                </div>

                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isVid
                                      ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                                      : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                  } transition-colors`}
                                >
                                  {isVid ? <Play className="w-3.5 h-3.5 fill-current" /> : <ExternalLink className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                          <span>No custom video or PDF attached yet for this specific topic.</span>
                          <button
                            onClick={() => {
                              setAddResourceTargetTopicId(topic.id);
                              setIsAddResourceOpen(true);
                            }}
                            className="text-xs text-indigo-700 font-bold hover:underline"
                          >
                            + Attach Video / PDF
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Subtopics Checklist with direct resource triggers */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">
                        Subtopics &amp; Learning Objectives:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topic.subtopics.map((sub, idx) => {
                          // Find if any resource matches this subtopic
                          const matchingResource = allTopicResources.find(
                            (r) => r.subtopicTitle?.toLowerCase() === sub.toLowerCase()
                          );

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">{sub}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {matchingResource ? (
                                  <button
                                    onClick={() => setSelectedResource(matchingResource)}
                                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
                                    title="Open matched study material"
                                  >
                                    {matchingResource.type === 'video_tutorial' ? (
                                      <Play className="w-2.5 h-2.5 fill-indigo-700" />
                                    ) : (
                                      <BookOpen className="w-2.5 h-2.5" />
                                    )}
                                    <span>
                                      {matchingResource.type === 'video_tutorial' ? 'Watch' : 'PDF'}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAddResourceTargetTopicId(topic.id);
                                      setAddResourceTargetSubtopic(sub);
                                      setIsAddResourceOpen(true);
                                    }}
                                    title="Attach a video or PDF to this subtopic"
                                    className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mathematical Formulas */}
                    {topic.formulas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                          <Sigma className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Core Formulas &amp; Theorems:</span>
                        </h4>
                        <div className="space-y-2.5">
                          {topic.formulas.map((form) => (
                            <div
                              key={form.id}
                              className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                <span>{form.title}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {form.tag}
                                </span>
                              </div>
                              <div className="p-2 bg-slate-900 text-emerald-300 font-mono text-xs rounded overflow-x-auto">
                                <code>{form.latex}</code>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-normal">
                                {form.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common Traps */}
                    {topic.commonTraps.length > 0 && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Dangerous GATE Traps &amp; Misconceptions:</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                          {topic.commonTraps.map((trap, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {trap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* RESOURCE VIEWER MODAL */}
      <ResourceViewerModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
      />

      {/* ADD RESOURCE MODAL */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => {
          setIsAddResourceOpen(false);
          setAddResourceTargetTopicId(undefined);
          setAddResourceTargetSubtopic(undefined);
        }}
        subjects={subjects}
        defaultSubjectId={activeSubject.id}
        defaultTopicId={addResourceTargetTopicId}
        defaultSubtopicTitle={addResourceTargetSubtopic}
        onSaveResource={handleSaveResource}
      />
    </div>
  );
};
