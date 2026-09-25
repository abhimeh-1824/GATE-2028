import React, { useState } from 'react';
import { X, Download, Upload, Check, AlertCircle, Copy, Link2, RefreshCw } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    exportDataJson,
    importDataJson,
    linkedAppletConfig,
    syncWithLinkedApplet,
    isSyncingLinkedApplet,
    setIsLinkedSyncModalOpen,
  } = useStudy();
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportDownload = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gate_da_2028_study_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const jsonStr = exportDataJson();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const ok = importDataJson(importText.trim());
    if (ok) {
      setStatusMsg({ type: 'success', text: 'Backup data successfully restored!' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1500);
    } else {
      setStatusMsg({ type: 'error', text: 'Invalid JSON backup format. Please check the text.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Study Data Backup & Restore</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Export Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Export Current Progress</h3>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Download your full syllabus marks, active tasks, mock test history, and custom settings as a portable JSON file.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON Backup</span>
              </button>
              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Import Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Restore From Backup</h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Paste the contents of a previously exported JSON backup file below to restore:
            </p>
            <textarea
              rows={4}
              placeholder="Paste JSON backup here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
            {statusMsg && (
              <div
                className={`mt-2 p-2 rounded text-xs flex items-center gap-1.5 ${
                  statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
