import React, { useMemo, useState } from 'react';
import {
  X,
  FileText,
  Zap,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { StudyNote, NoteType } from '../../types';
import { buildSandboxedSrcDoc } from '../../utils/htmlSanitizer';

interface HtmlNotesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  breadcrumbs: string[];
  completeNote?: StudyNote | null;
  shortNote?: StudyNote | null;
  initialNoteType: NoteType;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const HtmlNotesViewerModal: React.FC<HtmlNotesViewerModalProps> = ({
  isOpen,
  onClose,
  breadcrumbs,
  completeNote,
  shortNote,
  initialNoteType,
}) => {
  const [activeType, setActiveType] = useState<NoteType>(initialNoteType);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialNoteType === 'complete' && completeNote) {
        setActiveType('complete');
      } else if (initialNoteType === 'short' && shortNote) {
        setActiveType('short');
      } else if (completeNote) {
        setActiveType('complete');
      } else if (shortNote) {
        setActiveType('short');
      }
    }
  }, [isOpen, initialNoteType, completeNote, shortNote]);

  const currentNote = activeType === 'complete' ? completeNote : shortNote;

  const srcDoc = useMemo(() => {
    if (!currentNote?.htmlContent) return '';
    return buildSandboxedSrcDoc(currentNote.htmlContent, currentNote.title);
  }, [currentNote?.htmlContent, currentNote?.title]);

  if (!isOpen) return null;

  const frameWidthClass =
    viewport === 'mobile'
      ? 'w-[390px] max-w-full border-x border-slate-200 shadow-sm'
      : viewport === 'tablet'
        ? 'w-[768px] max-w-full border-x border-slate-200 shadow-sm'
        : 'w-full';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="HTML Study Notes Viewer"
    >
      <div
        className={`bg-white border border-slate-200 flex flex-col overflow-hidden shadow-2xl transition-all ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-6xl h-[90vh] rounded-xl'
        }`}
      >
        {/* Top Bar */}
        <header className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {/* Breadcrumb Trail */}
            <div className="flex items-center flex-wrap gap-1 text-[11px] font-medium text-slate-500">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb}-${idx}`}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? 'text-indigo-700 font-semibold truncate max-w-[220px]'
                        : 'truncate max-w-[160px]'
                    }
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {currentNote?.title ||
                  (activeType === 'complete' ? 'Complete Study Notes' : 'Short Revision Notes')}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-3 h-3" />
                Sandboxed Viewer
              </span>
            </div>
          </div>

          {/* Complete / Short Segmented Switcher */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                disabled={!completeNote}
                onClick={() => setActiveType('complete')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeType === 'complete'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : completeNote
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Complete Notes
              </button>
              <button
                type="button"
                disabled={!shortNote}
                onClick={() => setActiveType('short')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeType === 'short'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : shortNote
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Short Notes
              </button>
            </div>

            {/* Viewport Switcher */}
            <div className="hidden md:inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                title="Desktop Width"
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                title="Tablet Width (768px)"
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'tablet'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                title="Mobile Width (390px)"
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Notes Viewer"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sandboxed Rendering Stage */}
        <div className="flex-1 bg-[#faf8ff] overflow-hidden flex justify-center">
          {currentNote && srcDoc ? (
            <iframe
              key={`${currentNote.id}-${activeType}`}
              title={currentNote.title || 'Study Notes'}
              srcDoc={srcDoc}
              // Strictly allow isolated scripts for educational animations WITHOUT allow-same-origin,
              // allow-top-navigation, allow-popups, or allow-forms.
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              className={`h-full bg-white transition-all duration-200 ${frameWidthClass}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No {activeType === 'complete' ? 'Complete' : 'Short'} Notes Uploaded Yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Content Managers or Admins can upload interactive HTML notes for this level in the
                Notes &amp; Tests Studio.
              </p>
            </div>
          )}
        </div>

        {/* Footer Metadata */}
        {currentNote && (
          <footer className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Updated {new Date(currentNote.updatedAt).toLocaleString()}
            </span>
            <span className="font-mono text-slate-400">
              {activeType === 'complete' ? 'COMPLETE NOTES' : 'SHORT NOTES'} • ISOLATED SANDBOX
            </span>
          </footer>
        )}
      </div>
    </div>
  );
};
