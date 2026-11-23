import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  Check,
  Copy,
  Pencil,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { StudyGroupChat } from './StudyGroupChat';
import {
  ChatConversationSummary,
  ChatMessage,
  adminDeleteChatMessage,
  deleteChatMessage,
  editChatMessage,
  getMyChatId,
  isValidChatId,
  loadChatConversations,
  loadChatMessages,
  reportChatMessage,
  sendChatMessage,
  setChatUserBlocked,
  startDirectChat,
} from '../../lib/chatService';

const REPORT_REASONS = [
  { value: 'abuse', label: 'Abusive language' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'illegal', label: 'Illegal or cheating request' },
  { value: 'personal_info', label: 'Personal information' },
  { value: 'other', label: 'Other concern' },
] as const;

const formatDate = (value: string) => new Date(value).toLocaleDateString();
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const ChatView: React.FC = () => {
  const { currentUser, isDemo, isAdmin, setIsAuthModalOpen } = useStudy();
  const userId = currentUser?.id;
  const isAuthenticated = Boolean(userId && !isDemo && !userId.startsWith('demo_'));
  const [myChatId, setMyChatId] = useState('');
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatIdInput, setChatIdInput] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('group');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [confirmBlockPeer, setConfirmBlockPeer] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    const result = await loadChatConversations();
    setConversations(result);
  }, [isAuthenticated]);

  const refreshMessages = useCallback(async () => {
    if (!selectedConversationId || !isAuthenticated) return;
    const result = await loadChatMessages(selectedConversationId);
    setMessages(result);
  }, [isAuthenticated, selectedConversationId]);

  useEffect(() => {
    let active = true;
    setError('');
    setNotice('');
    setSelectedConversationId(null);
    setMessages([]);

    if (!userId || !isAuthenticated) {
      setMyChatId('');
      setConversations([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    Promise.all([getMyChatId(), loadChatConversations()])
      .then(([ownChatId, result]) => {
        if (!active) return;
        setMyChatId(ownChatId);
        setConversations(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load chat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!selectedConversationId || !isAuthenticated) {
      setMessages([]);
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        const result = await loadChatMessages(selectedConversationId);
        if (active) setMessages(result);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load messages.');
      }
    };

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 6000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, selectedConversationId]);

  const handleStartChat = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidChatId(chatIdInput)) {
      setError('Enter a valid chat ID.');
      return;
    }

    setError('');
    setNotice('');
    try {
      const conversationId = await startDirectChat(chatIdInput);
      await refreshConversations();
      setSelectedConversationId(conversationId);
      setChatIdInput('');
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start chat.');
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedConversation || !draft.trim() || sending || selectedConversation.blockedByMe) return;

    setSending(true);
    setError('');
    setNotice('');
    try {
      await sendChatMessage(selectedConversation.id, draft.trim());
      setDraft('');
      await Promise.all([refreshMessages(), refreshConversations()]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleBlock = async (conversation: ChatConversationSummary) => {
    if (!userId) {
      setError('Sign in to manage blocked users.');
      return;
    }

    setError('');
    setNotice('');
    try {
      await setChatUserBlocked(conversation.peerChatId, !conversation.blockedByMe);
      setConfirmBlockPeer(false);
      await refreshConversations();
      setNotice(conversation.blockedByMe ? 'Chat ID unblocked.' : 'Chat ID blocked. New messages are disabled.');
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : 'Could not update block setting.');
    }
  };

  const handleReport = async (messageId: string, reason: typeof REPORT_REASONS[number]['value']) => {
    setError('');
    setNotice('');
    try {
      await reportChatMessage(messageId, reason);
      setReportedMessageIds((previous) => new Set(previous).add(messageId));
      setNotice('Report submitted.');
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Could not report this message.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editDraft.trim() || savingEdit) return;

    setSavingEdit(true);
    setError('');
    setNotice('');
    try {
      await editChatMessage(editingMessageId, editDraft.trim());
      setEditingMessageId(null);
      setEditDraft('');
      await refreshMessages();
      setNotice('Message updated.');
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Could not edit message.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (messageId: string, useAdminModeration: boolean) => {
    setDeletingMsgId(messageId);
    setError('');
    setNotice('');
    try {
      if (useAdminModeration) {
        await adminDeleteChatMessage(messageId);
      } else {
        await deleteChatMessage(messageId);
      }
      setConfirmDeleteMsgId(null);
      await refreshMessages();
      setNotice(
        useAdminModeration
          ? 'Message removed by administrator.'
          : 'Message permanently deleted.'
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete message.');
    } finally {
      setDeletingMsgId(null);
    }
  };

  const handleCopyChatId = async () => {
    try {
      await navigator.clipboard.writeText(myChatId);
      setNotice('Chat ID copied.');
    } catch {
      setError('Could not copy the chat ID. Select and copy it manually.');
    }
  };

  if (!userId || !isAuthenticated) {
    return (
      <section className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <MessageCircle className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Study chat</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Sign in with a permanent account to get a private chat ID and message other registered users.
        </p>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-5 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
        >
          Sign in or register
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <MessageCircle className="h-6 w-6 text-indigo-700" />
            <h1 className="text-2xl font-bold text-slate-900">Study chat</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                <Shield className="h-3.5 w-3.5" />
                Admin Moderation
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">Connect using a chat ID. No names or email addresses are shown.</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Your chat ID</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-xs text-indigo-900">{loading ? 'Loading…' : myChatId || 'Unavailable'}</code>
            <button
              type="button"
              onClick={() => void handleCopyChatId()}
              disabled={!myChatId}
              className="rounded p-1 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
              aria-label="Copy your chat ID"
              title="Copy chat ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Use chat for education only. The server blocks obvious abuse, violence, illegal activity, and contact details, but filters can miss context. Your messages can be edited or permanently deleted for one hour. Messages are not end-to-end encrypted: the service can read them for moderation. Do not share sensitive information.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div role="tablist" aria-label="Chat type" className="flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'direct'}
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            activeTab === 'direct' ? 'bg-indigo-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Direct chats
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'group'}
          onClick={() => setActiveTab('group')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            activeTab === 'group' ? 'bg-indigo-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          GATE Study Group
        </button>
      </div>

      {activeTab === 'group' ? <StudyGroupChat /> : (
      <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`flex min-h-[560px] flex-col border-slate-200 lg:border-r ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">Start a conversation</h2>
            <form onSubmit={handleStartChat} className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatIdInput}
                onChange={(event) => setChatIdInput(event.target.value)}
                placeholder="Paste their chat ID"
                aria-label="Chat ID"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!isValidChatId(chatIdInput)}
                className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Chat
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 py-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Conversations</h2>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  void refreshConversations().catch((refreshError: unknown) => {
                    setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh conversations.');
                  });
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-700"
                aria-label="Refresh conversations"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            {loading ? (
              <p className="px-2 py-5 text-center text-xs text-slate-500">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs leading-5 text-slate-500">
                No conversations yet. Paste another user’s chat ID to start.
              </p>
            ) : conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setError('');
                  setSelectedConversationId(conversation.id);
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px] font-semibold text-slate-800">{conversation.peerChatId}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{formatDate(conversation.updatedAt)}</div>
                </div>
                {conversation.blockedByMe && <Ban className="h-4 w-4 shrink-0 text-rose-500" aria-label="Blocked" />}
              </button>
            ))}
          </div>
        </aside>

        <div className={`min-h-[560px] flex-col ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId(null)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Chat ID</div>
                    <div className="truncate font-mono text-xs font-semibold text-slate-900">{selectedConversation.peerChatId}</div>
                  </div>
                </div>
                {confirmBlockPeer ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleToggleBlock(selectedConversation)}
                      className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Confirm {selectedConversation.blockedByMe ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBlockPeer(false)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmBlockPeer(true)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      selectedConversation.blockedByMe
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    {selectedConversation.blockedByMe ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                    {selectedConversation.blockedByMe ? 'Unblock' : 'Block'}
                  </button>
                )}
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-48 items-center justify-center text-center text-xs text-slate-500">
                    No messages yet. Keep the conversation focused on studying.
                  </div>
                ) : messages.map((message) => {
                  const isMine = message.senderIsMe;
                  const canSelfModify =
                    isMine && Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000;
                  const useAdminDelete = isAdmin && !canSelfModify;
                  const isConfirmingDel = confirmDeleteMsgId === message.id;

                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                        isMine ? 'rounded-br-sm bg-indigo-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                      }`}>
                        {editingMessageId === message.id ? (
                          <div className="min-w-56 space-y-2">
                            <textarea
                              value={editDraft}
                              onChange={(event) => setEditDraft(event.target.value)}
                              maxLength={2000}
                              aria-label="Edit message"
                              className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditDraft('');
                                }}
                                className="rounded px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-white/20"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSaveEdit()}
                                disabled={savingEdit || !editDraft.trim()}
                                className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-indigo-800 disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                        )}
                        <div className={`mt-1 flex items-center justify-between gap-4 text-[10px] ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <span>{formatTime(message.createdAt)}{message.editedAt ? ' · edited' : ''}</span>
                          {!editingMessageId && (
                            <span className="flex items-center gap-2">
                              {canSelfModify && !isConfirmingDel && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditDraft(message.body);
                                  }}
                                  className="flex items-center gap-1 hover:underline"
                                >
                                  <Pencil className="h-3 w-3" />Edit
                                </button>
                              )}

                              {(canSelfModify || isAdmin) && (
                                isConfirmingDel ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={deletingMsgId === message.id}
                                      onClick={() => void handleDeleteMessage(message.id, useAdminDelete)}
                                      className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                                    >
                                      {deletingMsgId === message.id ? 'Deleting…' : 'Confirm'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteMsgId(null)}
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                        isMine
                                          ? 'bg-white/20 text-white hover:bg-white/30'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Cancel
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteMsgId(message.id)}
                                    className={`flex items-center gap-1 hover:underline ${
                                      useAdminDelete && !isMine ? 'text-rose-600 font-semibold' : ''
                                    }`}
                                    title={useAdminDelete ? 'Admin security delete' : 'Delete message'}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    {useAdminDelete ? 'Admin Delete' : 'Delete'}
                                  </button>
                                )
                              )}

                              {!isMine && !isConfirmingDel && (
                                reportedMessageIds.has(message.id) ? (
                                  <span className="flex items-center gap-1"><Check className="h-3 w-3" />Reported</span>
                                ) : (
                                  <details className="relative">
                                    <summary className="cursor-pointer list-none hover:underline">Report</summary>
                                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 text-xs text-slate-700 shadow-lg">
                                      {REPORT_REASONS.map((reason) => (
                                        <button
                                          key={reason.value}
                                          type="button"
                                          onClick={() => void handleReport(message.id, reason.value)}
                                          className="block w-full rounded px-2 py-1.5 text-left hover:bg-rose-50 hover:text-rose-700"
                                        >
                                          {reason.label}
                                        </button>
                                      ))}
                                    </div>
                                  </details>
                                )
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedConversation.blockedByMe ? (
                <div className="border-t border-slate-200 bg-rose-50 px-4 py-3 text-center text-xs text-rose-800">
                  This chat is blocked. Unblock the chat ID to send messages again.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 border-t border-slate-200 p-3">
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
                    placeholder="Ask a study question…"
                    aria-label="Message"
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
              )}
              <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
                <LockKeyhole className="h-3 w-3" />
                TLS in transit; not end-to-end encrypted. Edit or permanently delete your messages within one hour.
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <LockKeyhole className="h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-semibold text-slate-700">Your private conversations</h2>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                Select a conversation or enter a chat ID. No public user directory is available.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
};
