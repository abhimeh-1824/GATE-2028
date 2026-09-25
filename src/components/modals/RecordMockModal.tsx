import React, { useState, useEffect } from 'react';
import { X, Award, Trash2, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { MockTest } from '../../types';

interface RecordMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockToEdit?: MockTest | null;
}

export const RecordMockModal: React.FC<RecordMockModalProps> = ({
  isOpen,
  onClose,
  mockToEdit,
}) => {
  const { addMockTest, updateMockTest, deleteMockTest } = useStudy();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [score, setScore] = useState<number>(65.0);
  const [accuracy, setAccuracy] = useState<number>(82);
  const [percentile, setPercentile] = useState<number>(98.5);
  const [strongAreas, setStrongAreas] = useState('Linear Algebra, Probability');
  const [weakAreas, setWeakAreas] = useState('Multi-variable Calculus, Neural Networks');

  useEffect(() => {
    if (isOpen) {
      if (mockToEdit) {
        setTitle(mockToEdit.title);
        setDate(mockToEdit.date);
        setScore(mockToEdit.score);
        setAccuracy(mockToEdit.accuracy);
        setPercentile(mockToEdit.percentile);
        setStrongAreas(mockToEdit.strongAreas?.join(', ') || '');
        setWeakAreas(mockToEdit.weakAreas?.join(', ') || '');
      } else {
        setTitle(`Full Syllabus CBT Mock ${Date.now().toString().slice(-2)}`);
        setDate(new Date().toISOString().split('T')[0]);
        setScore(70.0);
        setAccuracy(85);
        setPercentile(99.0);
        setStrongAreas('Linear Algebra, Probability, SQL');
        setWeakAreas('Calculus Optimization');
      }
    }
  }, [isOpen, mockToEdit]);

  // Handle Escape key
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedStrong = strongAreas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedWeak = weakAreas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (mockToEdit) {
      updateMockTest(mockToEdit.id, {
        title: title.trim(),
        date,
        score: Number(score) || 0,
        totalMarks: 100,
        accuracy: Number(accuracy) || 0,
        percentile: Number(percentile) || 0,
        timeTakenMinutes: 180,
        totalTimeMinutes: 180,
        testType: 'Full Length',
        strongAreas: parsedStrong,
        weakAreas: parsedWeak,
      });
    } else {
      addMockTest({
        title: title.trim(),
        date,
        score: Number(score) || 0,
        totalMarks: 100,
        accuracy: Number(accuracy) || 0,
        percentile: Number(percentile) || 0,
        timeTakenMinutes: 180,
        totalTimeMinutes: 180,
        testType: 'Full Length',
        strongAreas: parsedStrong,
        weakAreas: parsedWeak,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (mockToEdit) {
      deleteMockTest(mockToEdit.id);
      onClose();
    }
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
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {mockToEdit ? 'Edit Mock CBT Simulation' : 'Record Full-Length Mock CBT Test'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mock Test Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Made Easy All-India Open Mock 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Attempted
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Score (out of 100) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accuracy (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={accuracy}
                onChange={(e) => setAccuracy(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Predicted Percentile (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                required
                value={percentile}
                onChange={(e) => setPercentile(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Strong Areas (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Linear Algebra, SQL, Probability"
              value={strongAreas}
              onChange={(e) => setStrongAreas(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Weak Areas / Questions Missed (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Multi-variable Optimization, Deep Neural Nets"
              value={weakAreas}
              onChange={(e) => setWeakAreas(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {mockToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Test</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {mockToEdit ? 'Save Changes' : 'Record Test'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
