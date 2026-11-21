import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { SubjectId } from '../../types';

export type SyllabusEntryTarget =
  | { kind: 'subject' }
  | { kind: 'topic'; subjectId: SubjectId; subjectName: string }
  | {
      kind: 'subtopic';
      subjectId: SubjectId;
      subjectName: string;
      topicId: string;
      topicName: string;
    };

interface SyllabusEntryModalProps {
  target: SyllabusEntryTarget | null;
  onClose: () => void;
  onAddSubject: (name: string, shortCode: string) => Promise<string>;
  onAddTopic: (subjectId: SubjectId, title: string) => Promise<void>;
  onAddSubtopic: (subjectId: SubjectId, topicId: string, name: string) => Promise<void>;
}

export const SyllabusEntryModal: React.FC<SyllabusEntryModalProps> = ({
  target,
  onClose,
  onAddSubject,
  onAddTopic,
  onAddSubtopic,
}) => {
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName('');
    setShortCode('');
    setErrorMessage('');
    setIsSaving(false);
  }, [target]);

  if (!target) return null;

  const heading = target.kind === 'subject'
    ? 'Add subject'
    : target.kind === 'topic'
    ? `Add topic to ${target.subjectName}`
    : `Add subtopic to ${target.topicName}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    setErrorMessage('');
    setIsSaving(true);
    try {
      if (target.kind === 'subject') {
        await onAddSubject(name, shortCode);
      } else if (target.kind === 'topic') {
        await onAddTopic(target.subjectId, name);
      } else {
        await onAddSubtopic(target.subjectId, target.topicId, name);
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save this syllabus entry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="syllabus-entry-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 id="syllabus-entry-title" className="text-sm font-bold text-slate-900">
              {heading}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {target.kind === 'subject' && (
            <div>
              <label htmlFor="subject-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Subject code
              </label>
              <input
                id="subject-code"
                value={shortCode}
                onChange={(event) => setShortCode(event.target.value.toUpperCase())}
                maxLength={20}
                required
                autoFocus
                placeholder="e.g. MATH"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="syllabus-entry-name" className="block text-xs font-semibold text-slate-700 mb-1">
              {target.kind === 'subject' ? 'Subject name' : target.kind === 'topic' ? 'Topic name' : 'Subtopic name'}
            </label>
            <input
              id="syllabus-entry-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={160}
              required
              autoFocus={target.kind !== 'subject'}
              placeholder={
                target.kind === 'subject'
                  ? 'Enter a subject name'
                  : target.kind === 'topic'
                  ? 'Enter a topic name'
                  : 'Enter a subtopic name'
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
