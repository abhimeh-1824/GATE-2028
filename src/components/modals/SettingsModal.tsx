import React, { useState } from 'react';
import { X, Award, Target, Save, Calendar } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStudy();

  const [userName, setUserName] = useState(settings.userName);
  const [targetAir, setTargetAir] = useState(settings.targetAir);
  const [targetCollege, setTargetCollege] = useState(settings.targetCollege);
  const [dailyGoalHours, setDailyGoalHours] = useState(settings.dailyGoalHours);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(settings.weeklyGoalHours);
  const [examDate, setExamDate] = useState(settings.examDate);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userName.trim() || 'Aspirant',
      targetAir: Number(targetAir) || 1,
      targetCollege: targetCollege.trim() || 'IISc Bangalore (M.Tech AI)',
      dailyGoalHours: Number(dailyGoalHours) || 4,
      weeklyGoalHours: Number(weeklyGoalHours) || 28,
      examDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">AIR Target & Study Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aspirant Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target AIR Rank
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={targetAir}
                  onChange={(e) => setTargetAir(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-700">
                  #
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Dream Institute & Program
            </label>
            <input
              type="text"
              value={targetCollege}
              onChange={(e) => setTargetCollege(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Study Target (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weekly Target (hrs)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="100"
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-2xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
