import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { SubjectId, TaskType, PriorityLevel } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose }) => {
  const { subjects, addTask } = useStudy();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId>('linear_algebra');
  const [topicTitle, setTopicTitle] = useState('');
  const [type, setType] = useState<TaskType>('concept');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [scheduledTime, setScheduledTime] = useState('09:00 AM');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const availableTopics = currentSubject?.topics || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      subjectId,
      topicTitle: topicTitle || (availableTopics[0]?.title || 'Core Topic'),
      type,
      durationMinutes: Number(durationMinutes) || 30,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      scheduledTime,
      priority,
      notes: notes.trim() || undefined,
    });

    onClose();
    // Reset form
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Add Study Target / Task</h2>
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
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Solve 20 Bayes Theorem & Conditional Probability PYQs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const newSubjId = e.target.value as SubjectId;
                  setSubjectId(newSubjId);
                  const sub = subjects.find((s) => s.id === newSubjId);
                  if (sub?.topics.length) {
                    setTopicTitle(sub.topics[0].title);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden bg-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic Area
              </label>
              <select
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden bg-white truncate"
              >
                {availableTopics.map((top) => (
                  <option key={top.id} value={top.title}>
                    {top.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Activity Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden bg-white"
              >
                <option value="concept">Concept Theory</option>
                <option value="textbook">Textbook Reading</option>
                <option value="pyq">GATE PYQ Drill</option>
                <option value="revision">Active Spaced Recall</option>
                <option value="test">Mock / Timed Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min="10"
                max="240"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden bg-white"
              >
                <option value="urgent">Critical (Urgent)</option>
                <option value="high">High Yield</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Time Block (e.g. 07:00 AM)
            </label>
            <input
              type="text"
              placeholder="e.g. 07:00 AM or Evening Block"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Notes / Specific Problems
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Focus on corner cases where determinants are zero or when rank < n."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-xs transition-colors"
            >
              Add Target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
