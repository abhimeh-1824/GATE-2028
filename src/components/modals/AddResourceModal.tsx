import React, { useState } from 'react';
import { StudyResource, ResourceType, SubjectId, Subject } from '../../types';
import {
  X,
  BookOpen,
  Video,
  Plus,
  Link as LinkIcon,
  Tag,
  Clock,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: SubjectId;
  defaultTopicId?: string;
  defaultSubtopicTitle?: string;
  onSaveResource: (targetId: string, resource: StudyResource) => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  subjects,
  defaultSubjectId = 'prob_stat',
  defaultTopicId,
  defaultSubtopicTitle = '',
  onSaveResource,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('video_tutorial');
  const [url, setUrl] = useState('');
  const [authorOrChannel, setAuthorOrChannel] = useState('');
  const [durationOrPages, setDurationOrPages] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>(defaultSubjectId);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || '');
  const [subtopicTitle, setSubtopicTitle] = useState(defaultSubtopicTitle);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeSub = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const topicList = activeSub?.topics || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the resource.');
      return;
    }
    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setError('Only secure HTTP and HTTPS web URLs are permitted.');
        return;
      }
    } catch {
      setError('Invalid web URL format. Please include http:// or https://');
      return;
    }

    const newResource: StudyResource = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      type,
      url: url.trim(),
      authorOrChannel: authorOrChannel.trim() || undefined,
      durationOrPages: durationOrPages.trim() || undefined,
      subtopicTitle: subtopicTitle.trim() || undefined,
      description: description.trim() || undefined,
      isStandardReference: false,
    };

    // Target is either topicId or subjectId
    const targetId = selectedTopicId || selectedSubjectId;
    onSaveResource(targetId, newResource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Add Study Resource (Book PDF or Video)
              </h3>
              <p className="text-[11px] text-slate-400">
                Attach reference materials to subjects, topics, or subtopics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Resource Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('video_tutorial')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'video_tutorial'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-rose-600" />
                <span>Tutorial Video Link</span>
              </button>

              <button
                type="button"
                onClick={() => setType('book_pdf')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'book_pdf'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Textbook PDF Document</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'video_tutorial'
                  ? 'e.g. 3Blue1Brown - Eigenvalues and Eigenvectors Chapter 14'
                  : 'e.g. Gilbert Strang - Chapter 3 Vector Spaces PDF'
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Web URL or Drive Link <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://...pdf"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Author & Duration in 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {type === 'video_tutorial' ? 'Channel / Faculty' : 'Author / Publisher'}
              </label>
              <input
                type="text"
                value={authorOrChannel}
                onChange={(e) => setAuthorOrChannel(e.target.value)}
                placeholder={type === 'video_tutorial' ? 'e.g. Gate Smashers' : 'e.g. Sheldon Ross'}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {type === 'video_tutorial' ? 'Duration (mins)' : 'Pages / Chapters'}
              </label>
              <input
                type="text"
                value={durationOrPages}
                onChange={(e) => setDurationOrPages(e.target.value)}
                placeholder={type === 'video_tutorial' ? 'e.g. 24 mins' : 'e.g. pp. 110-145'}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subject & Topic Mapping */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Attach to Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value as SubjectId);
                  setSelectedTopicId('');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Specific Topic (Optional)</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Entire Subject Level</option>
                {topicList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtopic name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Specific Subtopic Tag (Optional)
            </label>
            <input
              type="text"
              value={subtopicTitle}
              onChange={(e) => setSubtopicTitle(e.target.value)}
              placeholder="e.g. Bayes Theorem or Singular Value Decomposition"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Brief Notes / Summary</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key concepts covered, solved GATE PYQs, or important timestamps..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
            >
              Save Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
