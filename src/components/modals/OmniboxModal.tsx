import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Sigma, CheckSquare, ChevronRight, ArrowRight } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface OmniboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic?: (subjectId: string, topicId: string) => void;
  onOpenFormula?: (formulaId: string) => void;
}

export const OmniboxModal: React.FC<OmniboxModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
  onOpenFormula,
}) => {
  const { subjects, tasks, setActiveView } = useStudy();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search in topics
  const matchingTopics: Array<{
    subjectName: string;
    subjectId: string;
    topicId: string;
    title: string;
    status: string;
  }> = [];

  // Search in formulas
  const matchingFormulas: Array<{
    subjectName: string;
    topicTitle: string;
    formulaTitle: string;
    formulaPlain: string;
    formulaId: string;
  }> = [];

  // Search in tasks
  const matchingTasks = tasks.filter((t) =>
    cleanQuery ? t.title.toLowerCase().includes(cleanQuery) || t.topicTitle.toLowerCase().includes(cleanQuery) : false
  );

  subjects.forEach((subj) => {
    subj.topics.forEach((top) => {
      const matchTopic =
        !cleanQuery ||
        top.title.toLowerCase().includes(cleanQuery) ||
        subj.name.toLowerCase().includes(cleanQuery) ||
        top.subtopics.some((st) => st.toLowerCase().includes(cleanQuery));

      if (matchTopic) {
        matchingTopics.push({
          subjectName: subj.name,
          subjectId: subj.id,
          topicId: top.id,
          title: top.title,
          status: top.status,
        });
      }

      top.formulas.forEach((form) => {
        if (
          !cleanQuery ||
          form.title.toLowerCase().includes(cleanQuery) ||
          form.plainText.toLowerCase().includes(cleanQuery) ||
          form.explanation.toLowerCase().includes(cleanQuery)
        ) {
          matchingFormulas.push({
            subjectName: subj.name,
            topicTitle: top.title,
            formulaTitle: form.title,
            formulaPlain: form.plainText,
            formulaId: form.id,
          });
        }
      });
    });
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search syllabus, algorithms, formulas, PYQs, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-slate-800 placeholder-slate-400 outline-hidden bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {/* Topics matches */}
          {matchingTopics.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Syllabus Topics ({matchingTopics.length})
              </div>
              <div className="space-y-1">
                {matchingTopics.slice(0, 5).map((item) => (
                  <button
                    key={`${item.subjectId}-${item.topicId}`}
                    onClick={() => {
                      setActiveView('Subjects');
                      if (onSelectTopic) onSelectTopic(item.subjectId, item.topicId);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.subjectName}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formula matches */}
          {matchingFormulas.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Formulas & Mathematical Results ({matchingFormulas.length})
              </div>
              <div className="space-y-1">
                {matchingFormulas.slice(0, 4).map((f) => (
                  <button
                    key={f.formulaId}
                    onClick={() => {
                      if (onOpenFormula) onOpenFormula(f.formulaId);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sigma className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {f.formulaTitle}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 truncate">
                          {f.formulaPlain}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {f.subjectName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks matches */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Matching Study Tasks ({matchingTasks.length})
              </div>
              <div className="space-y-1">
                {matchingTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveView('Daily');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{t.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {t.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingTopics.length === 0 && matchingFormulas.length === 0 && matchingTasks.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No syllabus elements or formulas found matching "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or search query</span>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-white px-1 border border-slate-200 rounded">ESC</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
