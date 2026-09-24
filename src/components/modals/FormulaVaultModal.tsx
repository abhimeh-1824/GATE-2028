import React, { useState } from 'react';
import { X, Sigma, AlertTriangle, BookOpen, Filter, Search } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { SubjectId } from '../../types';

interface FormulaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormulaId?: string | null;
}

export const FormulaVaultModal: React.FC<FormulaVaultModalProps> = ({
  isOpen,
  onClose,
  selectedFormulaId,
}) => {
  const { subjects } = useStudy();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  // Flatten all formulas with parent subject and topic info
  const allFormulas: Array<{
    subjectId: SubjectId;
    subjectName: string;
    topicTitle: string;
    id: string;
    title: string;
    latex: string;
    plainText: string;
    explanation: string;
    tag: string;
    traps: string[];
  }> = [];

  subjects.forEach((s) => {
    s.topics.forEach((t) => {
      t.formulas.forEach((f) => {
        allFormulas.push({
          subjectId: s.id,
          subjectName: s.name,
          topicTitle: t.title,
          ...f,
          traps: t.commonTraps,
        });
      });
    });
  });

  const filteredFormulas = allFormulas.filter((f) => {
    const matchesSubj = selectedSubjectId === 'all' || f.subjectId === selectedSubjectId;
    const matchesSearch =
      !searchFilter ||
      f.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.plainText.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.topicTitle.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSubj && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <Sigma className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Formula & Common Traps Vault
              </h2>
              <p className="text-[11px] text-slate-500">
                High-yield mathematical proofs, theorems, and dangerous GATE DA edge-cases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedSubjectId === 'all'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedSubjectId === s.id
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.shortCode}
              </button>
            ))}
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter formulas..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md outline-hidden focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Formula Cards Grid */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 bg-slate-50/50">
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No formulas matching selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFormulas.map((item) => {
                const isHighlighted = selectedFormulaId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border bg-white shadow-2xs flex flex-col justify-between transition-all ${
                      isHighlighted
                        ? 'border-indigo-600 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                        <span className="font-semibold text-indigo-700">
                          {item.subjectName}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {item.tag}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 mb-1.5">
                        {item.title}
                      </h3>

                      {/* Mathematical Display */}
                      <div className="my-2.5 p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                        <code>{item.latex}</code>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-normal mb-3">
                        {item.explanation}
                      </p>
                    </div>

                    {/* Common Traps alert */}
                    {item.traps && item.traps.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-100 mt-1">
                        <div className="flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">
                            <strong>Trap:</strong> {item.traps[0]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
