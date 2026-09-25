import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Radio,
  Layers,
  Sparkles,
  Link2,
  Clock,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  DEFAULT_LINKED_APPLET_ID,
  DEFAULT_LINKED_PROJECT_ID,
  DEFAULT_LINKED_APPLET_URL,
} from '../../lib/linkedAppletSyncService';

interface LinkedAppletSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedAppletSyncModal: React.FC<LinkedAppletSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    linkedAppletConfig,
    isSyncingLinkedApplet,
    linkedSyncMessage,
    syncWithLinkedApplet,
    updateLinkedAppletConfig,
    toggleLinkedAutoSync,
    subjects,
    tasks,
    mockTests,
    totalHoursStudied,
    completedTopics,
    totalTopics,
    totalPyqsSolved,
  } = useStudy();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(linkedAppletConfig.appletUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'url' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveAdvanced = () => {
    try {
      let id = DEFAULT_LINKED_APPLET_ID;
      let project = DEFAULT_LINKED_PROJECT_ID;

      // Extract applet ID if full URL pasted
      const match = customUrlInput.match(/apps\/([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        id = match[1];
      }
      const projMatch = customUrlInput.match(/project=([a-zA-Z0-9-]+)/);
      if (projMatch && projMatch[1]) {
        project = projMatch[1];
      }

      updateLinkedAppletConfig({
        appletId: id,
        projectId: project,
        appletUrl: customUrlInput.trim(),
      });
      setShowAdvanced(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-[#faf8ff] to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Linked AI Studio Applet Sync</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE LINKED
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Continuous bi-directional study synchronization between AI Studio instances
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

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Target Applet Card */}
          <div className="rounded-xl border border-indigo-100 bg-[#f8f9ff] p-4.5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-700">
                  Target Linked Applet
                </div>
                <div className="text-xs font-bold text-slate-900 font-mono break-all">
                  {linkedAppletConfig.appletId}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Cloud Project:</span>
                  <span className="font-mono text-slate-700 font-semibold">{linkedAppletConfig.projectId}</span>
                </div>
              </div>

              <a
                href={linkedAppletConfig.appletUrl || DEFAULT_LINKED_APPLET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold shadow-2xs transition-colors"
                title="Open this linked applet in AI Studio"
              >
                <span>Open in AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick Copy Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/60 flex-wrap">
              <button
                onClick={() => handleCopy(linkedAppletConfig.appletId, 'id')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-medium transition-colors"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? 'Copied ID' : 'Copy Applet ID'}</span>
              </button>
              <button
                onClick={() => handleCopy(linkedAppletConfig.appletUrl, 'url')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-medium transition-colors"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied Full URL' : 'Copy Full Applet Link'}</span>
              </button>
              <span className="text-[11px] text-slate-400 ml-auto">
                {linkedAppletConfig.lastSyncedAt
                  ? `Last sync: ${new Date(linkedAppletConfig.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Not yet synchronized today'}
              </span>
            </div>
          </div>

          {/* Feedback Banner */}
          {linkedSyncMessage && (
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{linkedSyncMessage}</div>
            </div>
          )}

          {/* Live Telemetry Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center justify-between">
              <span>Current Synchronized Telemetry State</span>
              <span className="text-[11px] font-normal text-slate-500">Auto-merges highest scores & topics</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Topics Done</div>
                <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                  {completedTopics} <span className="text-xs text-slate-400 font-normal">/ {totalTopics}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Study Hours</div>
                <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">
                  {totalHoursStudied.toFixed(1)}h
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">PYQs Solved</div>
                <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                  {totalPyqsSolved}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Tasks & Tests</div>
                <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                  {tasks.length} <span className="text-xs text-slate-400 font-normal">/ {mockTests.length} mocks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Trigger Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800">Synchronize Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => syncWithLinkedApplet('bidirectional')}
                disabled={isSyncingLinkedApplet}
                className="flex flex-col items-center text-center p-3.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white transition-all shadow-xs"
              >
                <RefreshCw className={`w-5 h-5 mb-1.5 ${isSyncingLinkedApplet ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold">Bi-directional Sync</span>
                <span className="text-[10px] text-indigo-200 mt-0.5">Merge both nodes</span>
              </button>

              <button
                onClick={() => syncWithLinkedApplet('push')}
                disabled={isSyncingLinkedApplet}
                className="flex flex-col items-center text-center p-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 text-slate-800 transition-all shadow-2xs"
              >
                <UploadCloud className="w-5 h-5 mb-1.5 text-indigo-600" />
                <span className="text-xs font-bold">Push to Linked</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Upload current progress</span>
              </button>

              <button
                onClick={() => syncWithLinkedApplet('pull')}
                disabled={isSyncingLinkedApplet}
                className="flex flex-col items-center text-center p-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 text-slate-800 transition-all shadow-2xs"
              >
                <DownloadCloud className="w-5 h-5 mb-1.5 text-indigo-600" />
                <span className="text-xs font-bold">Pull from Linked</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Fetch latest changes</span>
              </button>
            </div>
          </div>

          {/* Continuous Auto-Sync Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                Continuous Live Auto-Sync
              </div>
              <div className="text-[11px] text-slate-500">
                Automatically broadcasts syllabus completions and task marks to companion tabs & cloud
              </div>
            </div>
            <button
              onClick={toggleLinkedAutoSync}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-hidden ${
                linkedAppletConfig.autoSync ? 'bg-indigo-700' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                  linkedAppletConfig.autoSync ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Advanced URL/ID Configuration Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-700 transition-colors"
            >
              {showAdvanced ? '− Hide Linked Applet Configuration' : '+ Edit Linked Applet Target URL / ID'}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    AI Studio Applet URL or ID
                  </label>
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://aistudio.google.com/apps/..."
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:border-indigo-600 outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setCustomUrlInput(DEFAULT_LINKED_APPLET_URL);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Reset to 2a25406d
                  </button>
                  <button
                    onClick={handleSaveAdvanced}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-700 text-white rounded-lg hover:bg-indigo-800"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#faf8ff] flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Connected via Shared Supabase & Broadcast Channel
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
