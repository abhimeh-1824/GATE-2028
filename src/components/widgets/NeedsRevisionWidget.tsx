import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Play,
  ArrowRight,
  TrendingDown,
  Target,
  Sparkles,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { TopicNeedingRevision, fetchTopicsNeedingRevision } from '../../lib/supabaseService';
import { soundManager } from '../../utils/audio';

interface NeedsRevisionWidgetProps {
  onSelectSubject?: (subjectId: string) => void;
  onOpenFormulaVault?: () => void;
}

export const NeedsRevisionWidget: React.FC<NeedsRevisionWidgetProps> = ({
  onSelectSubject,
  onOpenFormulaVault,
}) => {
  const { subjects, currentUser, setActiveView, setTimerSubject, setTimerMode, startTimer, updateTopicConfidence, updateTopicStatus } = useStudy();

  const [topics, setTopics] = useState<TopicNeedingRevision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'score' | 'accuracy' | 'both'>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTopicsNeedingRevision(currentUser?.id, subjects);
      setTopics(res);
    } catch (e) {
      console.error('Error fetching topics needing revision:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjects, currentUser?.id]);

  const handleStartDrill = (topic: TopicNeedingRevision) => {
    setTimerSubject(topic.subjectId, topic.title);
    setTimerMode('focus');
    startTimer();
    soundManager.playFocusAlert();
  };

  const handleGoToTopic = (topic: TopicNeedingRevision) => {
    if (onSelectSubject) {
      onSelectSubject(topic.subjectId);
    } else {
      setActiveView('Subjects');
    }
    soundManager.playSubtleTick();
  };

  const handleMarkResolved = (topic: TopicNeedingRevision) => {
    // Elevate confidence to 4 and mark completed/in_progress
    updateTopicConfidence(topic.subjectId, topic.id, 4);
    updateTopicStatus(topic.subjectId, topic.id, 'completed');
    soundManager.playCompletionChime();
    // Optimistically update list
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));
  };

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    if (filterType === 'score') return t.averageScore < 6;
    if (filterType === 'accuracy') return t.pyqAccuracy < 60;
    if (filterType === 'both') return t.reason === 'both';
    return true;
  });

  const bothCount = topics.filter((t) => t.reason === 'both').length;
  const scoreCount = topics.filter((t) => t.averageScore < 6).length;
  const accCount = topics.filter((t) => t.pyqAccuracy < 60).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header with Title and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Needs Revision</span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                {topics.length} Flagged
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Automated Supabase audit: topics flagged with <strong className="text-slate-700">score &lt; 6.0/10</strong> or <strong className="text-slate-700">PYQ accuracy &lt; 60%</strong>.
          </p>
        </div>

        {/* Filter controls & Refresh */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All ({topics.length})
            </button>
            <button
              onClick={() => setFilterType('both')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterType === 'both' ? 'bg-white text-rose-700 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Both ({bothCount})
            </button>
            <button
              onClick={() => setFilterType('accuracy')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterType === 'accuracy' ? 'bg-white text-amber-700 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Acc &lt; 60% ({accCount})
            </button>
            <button
              onClick={() => setFilterType('score')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterType === 'score' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Score &lt; 6 ({scoreCount})
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh from Supabase"
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Topics List or Empty State */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Auditing Supabase records for topics needing revision...</span>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center space-y-1.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
          <h3 className="text-xs font-bold text-emerald-900">
            High Retention Benchmark Achieved
          </h3>
          <p className="text-[11px] text-emerald-700 max-w-md mx-auto">
            All evaluated topics meet or exceed the minimum threshold of $\ge 6.0/10$ score and $\ge 60\%$ PYQ accuracy. Excellent precision!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTopics.slice(0, 6).map((topic) => {
            const isCritical = topic.weightageTier.includes('Critical');

            return (
              <div
                key={topic.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  {/* Subject Tag & Tier */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider truncate">
                      {topic.subjectName}
                    </span>
                    <span
                      className={`font-mono font-medium px-1.5 py-0.5 rounded ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {topic.weightageTier}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {topic.title}
                  </h3>

                  {/* Flag Reason Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">Avg Score</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-xs font-bold font-mono ${
                            topic.averageScore < 6 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {topic.averageScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">/ 10</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">PYQ Accuracy</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-xs font-bold font-mono ${
                            topic.pyqAccuracy < 60 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {topic.pyqAccuracy}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({topic.pyqsSolved}/{topic.pyqsTotal})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleStartDrill(topic)}
                    title="Launch 25-minute Pomodoro study sprint"
                    className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-indigo-700" />
                    <span>Focus Drill</span>
                  </button>

                  <button
                    onClick={() => handleGoToTopic(topic)}
                    title="Open in Syllabus with full notes and subtopics"
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>Syllabus</span>
                  </button>

                  <button
                    onClick={() => handleMarkResolved(topic)}
                    title="Mark topic as revised and mastered"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count indicator if > 6 items */}
      {filteredTopics.length > 6 && (
        <div className="pt-1 text-center">
          <span className="text-xs text-slate-500">
            Showing top 6 priority topics of {filteredTopics.length} total needing revision.
          </span>
        </div>
      )}
    </div>
  );
};
