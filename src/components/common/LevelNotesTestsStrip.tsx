import React from 'react';
import {
  FileText,
  Zap,
  ClipboardCheck,
  Play,
  Settings2,
  Award,
} from 'lucide-react';
import {
  StudyNote,
  LevelTest,
  TestAttempt,
  NoteEntityType,
  NoteType,
} from '../../types';

interface LevelNotesTestsStripProps {
  level: NoteEntityType;
  label: string;
  completeNote?: StudyNote | null;
  shortNote?: StudyNote | null;
  tests: LevelTest[];
  attempts: TestAttempt[];
  onOpenNotes: (noteType: NoteType) => void;
  onLaunchTest: (test: LevelTest) => void;
  onOpenStudio?: () => void;
  compact?: boolean;
}

export const LevelNotesTestsStrip: React.FC<LevelNotesTestsStripProps> = ({
  level,
  label,
  completeNote,
  shortNote,
  tests,
  attempts,
  onOpenNotes,
  onLaunchTest,
  onOpenStudio,
  compact = false,
}) => {
  const activeTests = tests.filter((t) => t.isActive);

  const getBestScore = (testId: string): number | null => {
    const relevant = attempts.filter((a) => a.testId === testId);
    if (!relevant.length) return null;
    return Math.max(...relevant.map((a) => a.percentage));
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${
        compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-3.5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            {level} Notes &amp; Tests
          </span>
          <span className="text-xs font-semibold text-slate-700 truncate max-w-[260px]">
            {label}
          </span>
        </div>

        {onOpenStudio && (
          <button
            type="button"
            onClick={onOpenStudio}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline whitespace-nowrap"
          >
            <Settings2 className="w-3 h-3" />
            Manage in Studio
          </button>
        )}
      </div>

      {/* Notes Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!completeNote}
          onClick={() => onOpenNotes('complete')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            completeNote
              ? 'bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-700 shadow-2xs'
              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{completeNote ? 'Read Complete Notes' : 'Complete Notes (Not Uploaded)'}</span>
        </button>

        <button
          type="button"
          disabled={!shortNote}
          onClick={() => onOpenNotes('short')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            shortNote
              ? 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{shortNote ? 'Read Short Notes' : 'Short Notes (Not Uploaded)'}</span>
        </button>
      </div>

      {/* Optional Tests Row */}
      {activeTests.length > 0 ? (
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
            Available {level} Assessments ({activeTests.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeTests.map((t) => {
              const best = getBestScore(t.id);
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:border-indigo-300 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{t.title}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5 text-[11px] font-mono text-slate-500">
                      <span>{t.questionCount ?? 0} Qs</span>
                      <span>•</span>
                      <span>{t.durationMinutes} min</span>
                      {best !== null && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                          <Award className="w-3 h-3" />
                          Best: {best}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLaunchTest(t)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 whitespace-nowrap"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Attempt
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Optional {level} test: No active test published at this level yet.
        </div>
      )}
    </div>
  );
};
