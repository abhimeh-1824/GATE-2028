import React, { useEffect, useState } from 'react';
import { Check, LockKeyhole, Pencil, RefreshCw, Send, Trash2, Users } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  ChatGroupMessage,
  ChatReportReason,
  deleteStudyGroupMessage,
  editStudyGroupMessage,
  ensureChatGroupMembership,
  loadStudyGroupMessages,
  reportStudyGroupMessage,
  sendStudyGroupMessage,
} from '../../lib/chatService';

const REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: 'abuse', label: 'Abusive language' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'illegal', label: 'Illegal or cheating request' },
  { value: 'personal_info', label: 'Personal information' },
  { value: 'other', label: 'Other concern' },
];

const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const StudyGroupChat: React.FC = () => {
  const { chatGroupJoinError, ensureChatGroupMembership: ensureMembership } = useStudy();
  const [messages, setMessages] = useState<ChatGroupMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    let intervalId: number | undefined;
    setLoading(true);
    setError('');

    const refresh = async () => {
      try {
        const result = await loadStudyGroupMessages();
        if (active) {
          setMessages(result);
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load group messages.');
      }
    };

    const joinAndLoad = async () => {
      try {
        await ensureMembership();
        if (!active) return;
        await refresh();
        if (active) intervalId = window.setInterval(() => void refresh(), 6000);
      } catch (joinError) {
        if (active) setError(joinError instanceof Error ? joinError.message : 'Could not join the study group.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void joinAndLoad();
    return () => {
      active = false;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [ensureMembership, retryToken]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;

    setSending(true);
    setError('');
    setNotice('');
    try {
      await ensureChatGroupMembership();
      await sendStudyGroupMessage(draft.trim());
      setDraft('');
      setMessages(await loadStudyGroupMessages());
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send group message.');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (messageId: string, reason: ChatReportReason) => {
    setError('');
    setNotice('');
    try {
      await reportStudyGroupMessage(messageId, reason);
      setReportedMessageIds((previous) => new Set(previous).add(messageId));
      setNotice('Report submitted.');
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Could not report this message.');
    }
  };

  const handleEdit = async (messageId: string, body: string): Promise<boolean> => {
    setError('');
    setNotice('');
    try {
      await editStudyGroupMessage(messageId, body);
      setMessages(await loadStudyGroupMessages());
      setNotice('Message updated.');
      return true;
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Could not edit group message.');
      return false;
    }
  };

  const handleDelete = async (messageId: string): Promise<boolean> => {
    if (!window.confirm('Delete this message permanently for everyone? This cannot be undone.')) return false;

    setError('');
    setNotice('');
    try {
      await deleteStudyGroupMessage(messageId);
      setMessages(await loadStudyGroupMessages());
      setNotice('Message permanently deleted.');
      return true;
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete group message.');
      return false;
    }
  };

  const handleRetry = () => {
    setError('');
    setNotice('');
    setRetryToken((previous) => previous + 1);
  };

  const visibleError = error || chatGroupJoinError;

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">GATE Study Group</h2>
            <p className="text-[11px] text-slate-500">Everyone joins automatically · Edit/delete your messages within 1 hour</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-700"
          aria-label="Refresh group messages"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      {visibleError && (
        <div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800">
          <span>{visibleError}</span>
          <button type="button" onClick={handleRetry} className="shrink-0 font-semibold underline">
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          {notice}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {loading ? (
          <div className="flex h-full min-h-48 items-center justify-center text-xs text-slate-500">Joining group…</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center text-center text-xs text-slate-500">
            No group messages yet. Start a study-focused conversation.
          </div>
        ) : messages.map((message) => (
          <GroupMessage
            key={message.id}
            message={message}
            reported={reportedMessageIds.has(message.id)}
            onReport={handleReport}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-slate-200 p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Ask a study question to the group…"
          aria-label="Group message"
          className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-10 items-center gap-2 rounded-xl bg-indigo-700 px-3 text-xs font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </button>
      </form>
      <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
        <LockKeyhole className="h-3 w-3" />
        TLS in transit; not end-to-end encrypted. Edit or permanently delete your messages within one hour.
      </div>
    </section>
  );
};

const GroupMessage: React.FC<{
  message: ChatGroupMessage;
  reported: boolean;
  onReport: (messageId: string, reason: ChatReportReason) => void;
  onEdit: (messageId: string, body: string) => Promise<boolean>;
  onDelete: (messageId: string) => Promise<boolean>;
}> = ({ message, reported, onReport, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const canModify = message.senderIsMe && Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000;

  const saveEdit = async () => {
    if (!editDraft.trim() || saving) return;
    setSaving(true);
    if (await onEdit(message.id, editDraft.trim())) setEditing(false);
    setSaving(false);
  };

  return (
    <div className={`flex ${message.senderIsMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
        message.senderIsMe ? 'rounded-br-sm bg-indigo-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
      }`}>
        {!message.senderIsMe && (
          <div className="mb-1 font-mono text-[10px] font-semibold text-indigo-700">ID {message.senderChatId}</div>
        )}
        {editing ? (
          <div className="min-w-[14rem] space-y-2">
            <textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              maxLength={2000}
              aria-label="Edit group message"
              className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditDraft(message.body);
                  setEditing(false);
                }}
                className="rounded px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving || !editDraft.trim()}
                className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-indigo-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
        )}
        <div className={`mt-1 flex items-center justify-between gap-4 text-[10px] ${
          message.senderIsMe ? 'text-indigo-200' : 'text-slate-400'
        }`}>
          <span>{formatTime(message.createdAt)}{message.editedAt ? ' · edited' : ''}</span>
          {canModify && !editing ? (
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 hover:underline">
                <Pencil className="h-3 w-3" />Edit
              </button>
              <button type="button" onClick={() => void onDelete(message.id)} className="flex items-center gap-1 hover:underline">
                <Trash2 className="h-3 w-3" />Delete
              </button>
            </span>
          ) : !message.senderIsMe && (
            reported ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" />Reported</span>
            ) : (
              <details className="relative">
                <summary className="cursor-pointer list-none hover:underline">Report</summary>
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 text-xs text-slate-700 shadow-lg">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => onReport(message.id, reason.value)}
                      className="block w-full rounded px-2 py-1.5 text-left hover:bg-rose-50 hover:text-rose-700"
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </details>
            )
          )}
        </div>
      </div>
    </div>
  );
};
