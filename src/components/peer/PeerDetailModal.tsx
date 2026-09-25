import React, { useState } from 'react';
import {
  UserProgressProfile,
  SubjectId,
  TopicStatus,
} from '../../types';
import {
  X,
  Lock,
  CheckCircle2,
  Clock,
  Circle,
  Star,
  BookOpen,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Flame,
  BarChart3
} from 'lucide-react';

interface PeerDetailModalProps {
  peer: UserProgressProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PeerDetailModal: React.FC<PeerDetailModalProps> = ({
  peer,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !peer) return null;

  return <PeerDetailModalContent peer={peer} onClose={onClose} />;
};

const PeerDetailModalContent: React.FC<{
  peer: UserProgressProfile;
  onClose: () => void;
}> = ({ peer, onClose }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>(
    (peer.subjects[0]?.subjectId as SubjectId) || 'prob_stat'
  );
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const activeSubjectData =
    peer.fullSubjects?.find((s) => s.id === selectedSubjectId) ||
    peer.fullSubjects?.[0];

  const activeSubjectSummary = peer.subjects.find((s) => s.subjectId === selectedSubjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
              {peer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{peer.fullName}</h2>
                {peer.isCurrentUser && (
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  <Lock className="w-3 h-3" />
                  READ-ONLY PEER AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <strong className="text-slate-700">AIR #{peer.targetAir}</strong> · {peer.targetCollege} · Class of {peer.targetYear}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Banner */}
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between text-xs text-amber-800 font-medium">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Observational Mode:</strong> You are viewing another student&apos;s curriculum progress. Changes and toggles are restricted.
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-700">Last active: {peer.lastActive}</span>
        </div>

        {/* Peer Core Numbers Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-50/50 border-b border-slate-200 text-center font-mono">
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase">Syllabus Complete</div>
            <div className="text-lg font-extrabold text-indigo-700">{peer.syllabusPercent}%</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase">Hours Logged</div>
            <div className="text-lg font-extrabold text-slate-900">{peer.totalHoursStudied}h</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase">PYQ Accuracy</div>
            <div className="text-lg font-extrabold text-emerald-600">{peer.overallPyqAccuracy}%</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase">Study Streak</div>
            <div className="text-lg font-extrabold text-amber-600 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{peer.studyStreakDays}d</span>
            </div>
          </div>
        </div>

        {/* Modal Body: Subject Tabs + Topic Breakdown */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Subject Navigation Column */}
          <div className="w-full md:w-64 border-r border-slate-200 bg-slate-50/40 p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
              GATE DA Subjects ({peer.subjects.length})
            </div>
            {peer.subjects.map((sub) => {
              const isSelected = sub.subjectId === selectedSubjectId;
              return (
                <button
                  key={sub.subjectId}
                  onClick={() => setSelectedSubjectId(sub.subjectId)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-700 text-white font-bold shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate max-w-[140px]">
                    <span className="font-mono text-[10px] opacity-80 mr-1.5">{sub.shortCode}</span>
                    <span>{sub.subjectName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sub.completionPercent}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Topics List (Read-Only) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {activeSubjectData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeSubjectData.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completed: {activeSubjectSummary?.completedTopics}/{activeSubjectSummary?.totalTopics} Topics ({activeSubjectSummary?.completionPercent}%) · Accuracy: {activeSubjectSummary?.pyqAccuracy}%
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    READ-ONLY TOPIC STATUSES
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeSubjectData.topics.map((top) => {
                    const isExpanded = expandedTopicId === top.id;
                    const isDone = top.status === 'completed';
                    const isInProg = top.status === 'in_progress';
                    const isRev = top.status === 'revision_due';

                    return (
                      <div
                        key={top.id}
                        className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs"
                      >
                        <div className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Read-Only Status Indicator (No click) */}
                            <div className="shrink-0" title={`Status: ${top.status}`}>
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : isRev ? (
                                <Clock className="w-5 h-5 text-amber-500" />
                              ) : isInProg ? (
                                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                </div>
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {top.title}
                                </span>
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                  {top.weightageTier}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>PYQs: {top.pyqsSolved}/{top.pyqsTotal}</span>
                                <span>·</span>
                                <span>Accuracy: {top.pyqAccuracy}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Static Read-Only Confidence Stars */}
                            <div className="flex items-center gap-0.5" title={`Confidence: ${top.confidenceScore}/5`}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= top.confidenceScore
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>

                            <button
                              onClick={() => setExpandedTopicId(isExpanded ? null : top.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Read-Only Subtopics */}
                        {isExpanded && top.subtopics && top.subtopics.length > 0 && (
                          <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 text-xs space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                              Official Subtopics ({top.subtopics.length})
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {top.subtopics.map((sub, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5 text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                                  <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="text-[11px] truncate">{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No syllabus topics found for this subject.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>All peer data is read-only for privacy &amp; integrity.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
