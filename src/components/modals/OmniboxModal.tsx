import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Sigma, CheckSquare, ChevronRight, ArrowRight, Video, ExternalLink } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { DEFAULT_SUBJECT_RESOURCES, DEFAULT_TOPIC_RESOURCES } from '../../data/subjectResources';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const cleanQuery = query.toLowerCase().trim();

  // Search in topics
  const matchingTopics: Array<{
    type: 'topic';
    subjectName: string;
    subjectId: string;
    topicId: string;
    title: string;
    status: string;
  }> = [];

  // Search in formulas
  const matchingFormulas: Array<{
    type: 'formula';
    subjectName: string;
    topicTitle: string;
    formulaTitle: string;
    formulaPlain: string;
    formulaId: string;
  }> = [];

  // Search in tasks
  const matchingTasks = tasks.filter((t) => {
    if (!cleanQuery) return false;
    return (
      t.title.toLowerCase().includes(cleanQuery) ||
      t.topicTitle.toLowerCase().includes(cleanQuery) ||
      t.notes?.toLowerCase().includes(cleanQuery)
    );
  });

  subjects.forEach((subj) => {
    subj.topics.forEach((top) => {
      if (!cleanQuery || top.title.toLowerCase().includes(cleanQuery) || subj.name.toLowerCase().includes(cleanQuery)) {
        matchingTopics.push({
          type: 'topic',
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
            type: 'formula',
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

  const totalResultsCount = matchingTopics.slice(0, 5).length + matchingFormulas.slice(0, 4).length + matchingTasks.slice(0, 3).length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResultsCount > 0 ? (prev + 1) % totalResultsCount : 0));
      }
      if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResultsCount > 0 ? (prev - 1 + totalResultsCount) % totalResultsCount : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, totalResultsCount]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search syllabus, algorithms, formulas, PYQs, tasks..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm text-slate-800 placeholder-slate-400 outline-hidden bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
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
                {matchingTopics.slice(0, 5).map((item, idx) => (
                  <button
                    key={`${item.subjectId}-${item.topicId}`}
                    onClick={() => {
                      setActiveView('Subjects');
                      if (onSelectTopic) onSelectTopic(item.subjectId, item.topicId);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors group cursor-pointer ${
                      selectedIndex === idx ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                    }`}
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
                Formulas &amp; Mathematical Results ({matchingFormulas.length})
              </div>
              <div className="space-y-1">
                {matchingFormulas.slice(0, 4).map((f) => (
                  <button
                    key={f.formulaId}
                    onClick={() => {
                      if (onOpenFormula) onOpenFormula(f.formulaId);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/50 text-left transition-colors group cursor-pointer"
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

          {/* Task matches */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Your Scheduled Tasks ({matchingTasks.length})
              </div>
              <div className="space-y-1">
                {matchingTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveView('Daily');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.topicTitle} · {t.durationMinutes}m
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${t.completed ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {t.completed ? 'Completed' : 'Pending'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingTopics.length === 0 && matchingFormulas.length === 0 && matchingTasks.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching topics, formulas, or tasks found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Use <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↓</kbd> to navigate</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd> to close</span>
          </div>
          <span>GATE DA 2028 Omnibox</span>
        </div>
      </div>
    </div>
  );
};
