import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Sigma,
  AlertTriangle,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Code,
  Type,
  Tag,
  RotateCcw,
} from 'lucide-react';
import katex from 'katex';
import { useStudy } from '../../context/StudyContext';
import { SubjectId, FormulaItem } from '../../types';

interface FormulaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormulaId?: string | null;
}

interface EnrichedFormula extends FormulaItem {
  subjectId: SubjectId;
  subjectName: string;
  subjectShortCode: string;
  topicTitle: string;
  traps: string[];
}

type VaultTheme = 'paper' | 'chalkboard';
type CardDisplayMode = 'formula' | 'latex' | 'text';

const SUBJECT_SHORT_PILLS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Subjects' },
  { id: 'prob_stat', label: 'P&S' },
  { id: 'linear_algebra', label: 'LA' },
  { id: 'calculus_opt', label: 'CALC' },
  { id: 'dsa_python', label: 'DSA' },
  { id: 'dbms_warehouse', label: 'DBMS' },
  { id: 'machine_learning', label: 'ML' },
  { id: 'artificial_intel', label: 'AI' },
  { id: 'general_aptitude', label: 'GA' },
  { id: 'mock_pyq', label: 'MOCK' },
];

/**
 * KaTeX Math Renderer Component
 */
const KaTeXView: React.FC<{
  math: string;
  isChalkboard: boolean;
  className?: string;
  isEnlarged?: boolean;
}> = ({ math, isChalkboard, className = '', isEnlarged = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch (err) {
        containerRef.current.innerText = math;
      }
    }
  }, [math]);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto py-1.5 flex justify-center items-center text-center select-text ${
        isChalkboard
          ? 'text-emerald-300 font-mono tracking-wide'
          : 'text-slate-900 font-serif'
      } ${isEnlarged ? 'text-xl lg:text-2xl' : 'text-base sm:text-lg'} ${className}`}
      style={{
        textShadow: isChalkboard ? '0 0 1px rgba(110, 231, 183, 0.5)' : 'none',
      }}
    />
  );
};

export const FormulaVaultModal: React.FC<FormulaVaultModalProps> = ({
  isOpen,
  onClose,
  selectedFormulaId,
}) => {
  const { subjects } = useStudy();

  const [theme, setTheme] = useState<VaultTheme>('chalkboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [cardDisplayModes, setCardDisplayModes] = useState<Record<string, CardDisplayMode>>({});
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const [enlargedFormula, setEnlargedFormula] = useState<EnrichedFormula | null>(null);

  // Flatten all formulas with parent subject and topic information
  const allFormulas = useMemo<EnrichedFormula[]>(() => {
    const list: EnrichedFormula[] = [];
    subjects.forEach((s) => {
      s.topics.forEach((t) => {
        (t.formulas || []).forEach((f) => {
          list.push({
            ...f,
            subjectId: s.id,
            subjectName: s.name,
            subjectShortCode: s.shortCode,
            topicTitle: t.title,
            traps: t.commonTraps || [],
          });
        });
      });
    });
    return list;
  }, [subjects]);

  // Extract unique tags alphabetically
  const allTags = useMemo<string[]>(() => {
    const tagsSet = new Set<string>();
    allFormulas.forEach((f) => {
      if (f.tag) tagsSet.add(f.tag);
    });
    return Array.from(tagsSet).sort();
  }, [allFormulas]);

  // Filter formulas by subject, tag, and search query
  const filteredFormulas = useMemo(() => {
    return allFormulas.filter((f) => {
      const matchesSubj = selectedSubjectId === 'all' || f.subjectId === selectedSubjectId;
      const matchesTag = selectedTag === 'all' || f.tag.toLowerCase() === selectedTag.toLowerCase();
      const q = searchFilter.trim().toLowerCase();
      const matchesSearch =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.latex.toLowerCase().includes(q) ||
        f.plainText.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q) ||
        f.subjectName.toLowerCase().includes(q) ||
        f.topicTitle.toLowerCase().includes(q);

      return matchesSubj && matchesTag && matchesSearch;
    });
  }, [allFormulas, selectedSubjectId, selectedTag, searchFilter]);

  // Auto-scroll or open target formula if selectedFormulaId is passed
  useEffect(() => {
    if (selectedFormulaId && isOpen) {
      const match = allFormulas.find((f) => f.id === selectedFormulaId);
      if (match) {
        setSelectedSubjectId(match.subjectId);
      }
    }
  }, [selectedFormulaId, isOpen, allFormulas]);

  if (!isOpen) return null;

  const handleCopyMath = (formula: EnrichedFormula) => {
    navigator.clipboard.writeText(formula.latex);
    setCopiedFormulaId(formula.id);
    setTimeout(() => setCopiedFormulaId(null), 2000);
  };

  const getDisplayMode = (id: string): CardDisplayMode => {
    return cardDisplayModes[id] || 'formula';
  };

  const setDisplayMode = (id: string, mode: CardDisplayMode) => {
    setCardDisplayModes((prev) => ({ ...prev, [id]: mode }));
  };

  const isChalkboard = theme === 'chalkboard';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 animate-in fade-in duration-150">
      <div className="bg-white w-[98vw] max-w-[1440px] h-[96vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* COMPACT ROW 1: Header + Search + Paper/Chalkboard + Close (Ultra Space Saving!) */}
        <header className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          {/* Left: Title & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sigma className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Formula &amp; Theorem Vault
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 font-mono shrink-0">
                {allFormulas.length} Formulas
              </span>
            </div>
          </div>

          {/* Center: Live Search Box (Integrated directly in Header) */}
          <div className="relative w-48 sm:w-64 md:w-80 lg:w-96 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search formulas, theorems, LaTeX..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Right: Theme Toggle & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setTheme('paper')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] transition-all ${
                  theme === 'paper'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paper
              </button>
              <button
                onClick={() => setTheme('chalkboard')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] transition-all ${
                  theme === 'chalkboard'
                    ? 'bg-[#0f172a] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chalkboard
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Vault"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* COMPACT ROW 2: Subject Filter Pills + Tag Scroller + Count (Single Slim Unified Bar!) */}
        <div className="px-4 py-1.5 border-b border-slate-100 bg-[#fbfbff] flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Subject Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            {SUBJECT_SHORT_PILLS.map((pill) => {
              const isSelected = selectedSubjectId === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedSubjectId(pill.id)}
                  className={`px-2.5 py-0.5 text-[11px] rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Right side: Showing Count, Active Tag Filter & Clear Button */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium shrink-0 ml-auto">
            {/* Tag selector dropdown / scroll */}
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="text-[11px] py-0.5 px-2 bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Tags ({allTags.length})</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-300">|</span>

            <div>
              Showing <strong className="font-bold text-slate-900">{filteredFormulas.length}</strong> of {allFormulas.length}
            </div>

            {(selectedSubjectId !== 'all' || selectedTag !== 'all' || searchFilter) && (
              <button
                onClick={() => {
                  setSelectedSubjectId('all');
                  setSelectedTag('all');
                  setSearchFilter('');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-[11px] ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* MAXIMUM SCREEN REAL-ESTATE FOR FORMULA CARDS */}
        <main
          className={`overflow-y-auto p-3 sm:p-4 flex-1 space-y-3.5 ${
            isChalkboard ? 'bg-[#060a14]' : 'bg-[#faf8ff]'
          }`}
        >
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-2">
              <Sigma className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
              <div className="text-sm font-semibold">No matching formulas found</div>
              <div className="text-xs text-slate-400">Try modifying your search or subject filters above</div>
            </div>
          ) : (
            filteredFormulas.map((item) => {
              const mode = getDisplayMode(item.id);
              const isCopied = copiedFormulaId === item.id;
              const isTargeted = selectedFormulaId === item.id;

              return (
                <article
                  key={item.id}
                  id={`formula-${item.id}`}
                  className={`rounded-xl transition-all shadow-md overflow-hidden border ${
                    isChalkboard
                      ? 'bg-[#0B132B] border-slate-800 text-white shadow-black/40'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-100'
                  } ${isTargeted ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                >
                  {/* Slim Card Header Toolbar */}
                  <div
                    className={`px-3.5 py-1.5 flex items-center justify-between border-b ${
                      isChalkboard
                        ? 'border-slate-800/90 bg-[#0d1733]'
                        : 'border-slate-100 bg-slate-50/80'
                    }`}
                  >
                    {/* Mode Switcher: Formula | LaTeX | Text */}
                    <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/10 text-xs">
                      <button
                        onClick={() => setDisplayMode(item.id, 'formula')}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                          mode === 'formula'
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : isChalkboard
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Formula</span>
                      </button>

                      <button
                        onClick={() => setDisplayMode(item.id, 'latex')}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                          mode === 'latex'
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : isChalkboard
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>LaTeX</span>
                      </button>

                      <button
                        onClick={() => setDisplayMode(item.id, 'text')}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                          mode === 'text'
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : isChalkboard
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Type className="w-3 h-3" />
                        <span>Text</span>
                      </button>
                    </div>

                    {/* Right: Copy Math & Enlarge */}
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => handleCopyMath(item)}
                        className={`flex items-center gap-1 font-medium text-[11px] transition-colors ${
                          isCopied
                            ? 'text-emerald-400 font-bold'
                            : isChalkboard
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Copy LaTeX formula to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Math</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setEnlargedFormula(item)}
                        className={`flex items-center gap-1 font-medium text-[11px] transition-colors ${
                          isChalkboard
                            ? 'text-indigo-300 hover:text-white'
                            : 'text-indigo-600 hover:text-indigo-900'
                        }`}
                        title="Enlarge formula view"
                      >
                        <span>Enlarge &rarr;</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Content: Title, Formula, Explanation & Traps in High-Density View */}
                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    {/* Header info line: Subject Badge, Tag & Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isChalkboard
                              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}
                        >
                          {item.subjectShortCode} · {item.subjectName}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isChalkboard
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{item.tag}
                        </span>
                        <h3
                          className={`text-sm sm:text-base font-bold ${
                            isChalkboard ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono shrink-0">
                        {item.topicTitle}
                      </div>
                    </div>

                    {/* THE FORMULA ITSELF - Fully visible with zero cutoff! */}
                    {mode === 'formula' && (
                      <div
                        className={`rounded-xl px-3 py-3 sm:py-4 flex items-center justify-center min-h-[68px] border shadow-inner ${
                          isChalkboard
                            ? 'bg-[#020817] border-slate-800/90 shadow-black'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <KaTeXView math={item.latex} isChalkboard={isChalkboard} />
                      </div>
                    )}

                    {/* LaTeX Mode */}
                    {mode === 'latex' && (
                      <div className="rounded-xl p-3 bg-[#0a0f1d] border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto select-all leading-relaxed">
                        <code>{item.latex}</code>
                      </div>
                    )}

                    {/* Text Mode */}
                    {mode === 'text' && (
                      <div
                        className={`rounded-xl p-3 text-xs font-mono border ${
                          isChalkboard
                            ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                            : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-bold text-indigo-400 text-[11px]">Plain Text Representation:</div>
                        <div className="text-xs font-semibold mt-0.5">{item.plainText}</div>
                      </div>
                    )}

                    {/* Two-Column Footer: Explanation on Left, Trap on Right (Saves Vertical Space!) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1 text-xs">
                      {/* Left: Explanation */}
                      <div
                        className={`md:col-span-7 leading-relaxed ${
                          isChalkboard ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {item.explanation}
                      </div>

                      {/* Right: Common Trap */}
                      <div className="md:col-span-5">
                        {item.traps && item.traps.length > 0 ? (
                          <div
                            className={`p-2 rounded-lg border flex items-start gap-1.5 text-[11px] ${
                              isChalkboard
                                ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold text-rose-400">Trap: </strong>
                              <span>{item.traps[0]}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No standard traps logged.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>

        {/* COMPACT FOOTER */}
        <footer className="px-4 py-2 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Formula format powered by KaTeX Math Engine • Click &quot;Enlarge&quot; for jumbo theorem analysis
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            Close Vault
          </button>
        </footer>
      </div>

      {/* Enlarge Detail Dialog */}
      {enlargedFormula && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl relative space-y-4 ${
              isChalkboard
                ? 'bg-[#0B132B] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white font-mono">
                  {enlargedFormula.subjectShortCode}
                </span>
                <h3 className="text-base font-bold">{enlargedFormula.title}</h3>
              </div>
              <button
                onClick={() => setEnlargedFormula(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Giant KaTeX View */}
            <div
              className={`p-6 sm:p-8 rounded-xl border shadow-inner flex items-center justify-center min-h-[120px] ${
                isChalkboard
                  ? 'bg-[#020817] border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <KaTeXView
                math={enlargedFormula.latex}
                isChalkboard={isChalkboard}
                isEnlarged={true}
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-indigo-400">Theoretical Explanation:</div>
              <p className="leading-relaxed opacity-90">{enlargedFormula.explanation}</p>
            </div>

            {enlargedFormula.traps.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-200 space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  GATE Exam Trap &amp; Boundary Conditions:
                </div>
                <p>{enlargedFormula.traps[0]}</p>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={() => handleCopyMath(enlargedFormula)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy LaTeX Source</span>
              </button>
              <button
                onClick={() => setEnlargedFormula(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
