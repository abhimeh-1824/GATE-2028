import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Upload, Check, AlertCircle, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJson, importDataJson } = useStudy();
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    try {
      const jsonStr = exportDataJson();
      navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Clipboard write failed. Please use Download instead.' });
    }
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const ok = importDataJson(importText.trim());
    if (ok) {
      setStatusMsg({ type: 'success', text: 'Backup data successfully validated and restored!' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Schema validation failed: The JSON file must contain a valid GATE DA syllabus or tasks array.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const ok = importDataJson(content);
        if (ok) {
          setStatusMsg({ type: 'success', text: `File "${file.name}" successfully validated and restored!` });
          setTimeout(() => {
            setStatusMsg(null);
            onClose();
          }, 1200);
        } else {
          setStatusMsg({
            type: 'error',
            text: `Invalid backup schema in "${file.name}". Please ensure this is an official study export.`,
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Study Data Backup &amp; Restore</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Export Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Export Current Progress</h3>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Download your full syllabus marks, active tasks, mock test history, and custom settings as a portable JSON file.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON Backup</span>
              </button>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Import Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-800">Restore From Backup</h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload .JSON File</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Select an exported JSON file or paste its contents below. Schema validation protects your active data from corruption:
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <textarea
              rows={4}
              placeholder="Paste JSON backup payload here or click 'Upload .JSON File' above..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />

            {statusMsg && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore &amp; Validate Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
