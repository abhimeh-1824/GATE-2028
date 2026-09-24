import React, { useState } from 'react';
import { StudyResource } from '../../types';
import {
  X,
  BookOpen,
  Video,
  ExternalLink,
  Award,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Copy,
  Check,
  StickyNote
} from 'lucide-react';

interface ResourceViewerModalProps {
  resource: StudyResource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceViewerModal: React.FC<ResourceViewerModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [personalNotes, setPersonalNotes] = useState('');

  if (!isOpen || !resource) return null;

  const isVideo = resource.type === 'video_tutorial';

  // Extract YouTube ID if applicable
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
      }
      if (url.includes('playlist?list=')) {
        const listMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
        if (listMatch) {
          return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const embedUrl = isVideo ? getYouTubeEmbedUrl(resource.url) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isVideo
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
              }`}
            >
              {isVideo ? <Video className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isVideo
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                      : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                  }`}
                >
                  {isVideo ? 'Tutorial Video' : 'Book PDF & Reference'}
                </span>
                {resource.isStandardReference && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 font-semibold">
                    <Award className="w-3 h-3" />
                    GATE Official Reference
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white truncate mt-0.5">
                {resource.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Embedded Video Player or PDF Reader Banner */}
          {isVideo && embedUrl ? (
            <div className="space-y-2">
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-slate-800">
                <iframe
                  src={embedUrl}
                  title={resource.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center font-mono">
                Embedded YouTube player active. You can take study notes below while watching.
              </p>
            </div>
          ) : !isVideo ? (
            <div className="p-6 bg-indigo-50/60 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Digital Book PDF / Open Access Document</span>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Click the button to open this textbook PDF in high-resolution full screen.
                </p>
                {resource.durationOrPages && (
                  <div className="text-[11px] font-mono text-indigo-800 font-semibold pt-1">
                    Coverage: {resource.durationOrPages}
                  </div>
                )}
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs"
              >
                <span>Open Full PDF Document</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-6 bg-rose-50/60 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Video className="w-4 h-4 text-rose-600" />
                  <span>External Lecture Course / Playlist</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  This course is hosted on an external platform (NPTEL / MIT OCW / YouTube Playlist).
                </p>
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs"
              >
                <span>Launch Video Playlist</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Instructor / Author
              </span>
              <div className="font-bold text-slate-800 mt-0.5 truncate">
                {resource.authorOrChannel || 'GATE Academic Faculty'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {isVideo ? 'Duration' : 'Pages / Scope'}
              </span>
              <div className="font-bold text-slate-800 mt-0.5">
                {resource.durationOrPages || (isVideo ? 'Video Lecture' : 'Reference Chapters')}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Mapped Subtopic
              </span>
              <div className="font-bold text-indigo-700 mt-0.5 truncate">
                {resource.subtopicTitle || 'Core GATE DA Module'}
              </div>
            </div>
          </div>

          {/* Description */}
          {resource.description && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Concept Overview &amp; Learning Value:</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {resource.description}
              </p>
            </div>
          )}

          {/* Study Scratchpad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                <span>Lecture Notes / Key Formulas From This Resource:</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Auto-saved in memory
              </span>
            </div>
            <textarea
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="e.g. At 14:20 Strang proves dim(Col(A)) = dim(Row(A)). Remember to apply in mock test 3..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Resource Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Open in New Browser Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
