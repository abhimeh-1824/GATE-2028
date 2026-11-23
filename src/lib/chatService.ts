import { supabase } from './supabase';

export interface ChatConversationSummary {
  id: string;
  peerChatId: string;
  updatedAt: string;
  blockedByMe: boolean;
}

export interface ChatMessage {
  id: string;
  senderIsMe: boolean;
  body: string;
  createdAt: string;
  editedAt: string | null;
}

export interface ChatGroupMessage extends ChatMessage {
  senderChatId: string;
}

export type ChatReportReason = 'abuse' | 'violence' | 'illegal' | 'personal_info' | 'other';

const CHAT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function chatRpcError(action: string, error: { code?: string; message: string }): Error {
  if (error.code === 'PGRST202') {
    return new Error(
      `${action}: Supabase cannot see the chat function yet. Run the latest supabase/setup.sql in the app's Supabase project. If it already completed, run NOTIFY pgrst, 'reload schema'; in SQL Editor, wait briefly, then refresh the app. Details: ${error.message}`,
    );
  }
  return new Error(`${action}: ${error.message}`);
}

export function isValidChatId(value: string): boolean {
  return CHAT_ID_PATTERN.test(value.trim());
}

export async function getMyChatId(): Promise<string> {
  const { data, error } = await supabase.rpc('chat_get_my_chat_id');

  if (error) throw chatRpcError('Could not load your chat ID', error);
  if (typeof data !== 'string') throw new Error('Your chat ID is not set. Ask the administrator to run the latest Supabase setup script.');
  return data;
}

export async function ensureChatGroupMembership(): Promise<void> {
  const { error } = await supabase.rpc('chat_group_join');
  if (error) throw chatRpcError('Could not join the study group', error);
}

export async function loadStudyGroupMessages(): Promise<ChatGroupMessage[]> {
  const { data, error } = await supabase.rpc('chat_group_load_messages');

  if (error) throw chatRpcError('Could not load study group messages', error);

  return (data || []).map((row: any) => ({
    id: row.message_id,
    senderChatId: row.sender_chat_id,
    senderIsMe: row.sender_is_me,
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  }));
}

export async function sendStudyGroupMessage(body: string): Promise<void> {
  const { error } = await supabase.rpc('chat_group_send_message', {
    p_body: body,
  });

  if (error) throw chatRpcError('Could not send group message', error);
}

export async function editStudyGroupMessage(messageId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('chat_group_edit_message', {
    p_message_id: messageId,
    p_body: body,
  });

  if (error) throw chatRpcError('Could not edit group message', error);
}

export async function deleteStudyGroupMessage(messageId: string): Promise<void> {
  const { error } = await supabase.rpc('chat_group_delete_message', {
    p_message_id: messageId,
  });

  if (error) throw chatRpcError('Could not delete group message', error);
}

export async function loadChatConversations(): Promise<ChatConversationSummary[]> {
  const { data, error } = await supabase.rpc('chat_list_conversations');

  if (error) throw chatRpcError('Could not load conversations', error);

  return (data || []).map((row: any) => ({
    id: row.conversation_id,
    peerChatId: row.peer_chat_id,
    updatedAt: row.updated_at,
    blockedByMe: row.blocked_by_me,
  }));
}

export async function loadChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase.rpc('chat_load_messages', {
    p_conversation_id: conversationId,
  });

  if (error) throw chatRpcError('Could not load messages', error);

  return (data || [])
    .map((row: any) => ({
      id: row.message_id,
      senderIsMe: row.sender_is_me,
      body: row.body,
      createdAt: row.created_at,
      editedAt: row.edited_at,
    }));
}

export async function startDirectChat(chatId: string): Promise<string> {
  if (!isValidChatId(chatId)) throw new Error('Enter a valid chat ID.');

  const { data, error } = await supabase.rpc('chat_start_direct_conversation', {
    p_chat_id: chatId.trim(),
  });

  if (error) throw chatRpcError('Could not start chat', error);
  if (typeof data !== 'string') throw new Error('Supabase did not return a conversation ID.');
  return data;
}

export async function sendChatMessage(conversationId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('chat_send_message', {
    p_conversation_id: conversationId,
    p_body: body,
  });

  if (error) throw chatRpcError('Could not send message', error);
}

export async function editChatMessage(messageId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('chat_edit_message', {
    p_message_id: messageId,
    p_body: body,
  });

  if (error) throw chatRpcError('Could not edit message', error);
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  const { error } = await supabase.rpc('chat_delete_message', {
    p_message_id: messageId,
  });

  if (error) throw chatRpcError('Could not delete message', error);
}

export async function setChatUserBlocked(chatId: string, blocked: boolean): Promise<void> {
  const { error } = await supabase.rpc('chat_set_user_blocked', {
    p_peer_chat_id: chatId,
    p_blocked: blocked,
  });

  if (error) throw chatRpcError('Could not update block setting', error);
}

export async function reportChatMessage(messageId: string, reason: ChatReportReason): Promise<void> {
  const { error } = await supabase.rpc('chat_report_message', {
    p_message_id: messageId,
    p_reason: reason,
  });

  if (error) throw chatRpcError('Could not report this message', error);
}

export async function reportStudyGroupMessage(messageId: string, reason: ChatReportReason): Promise<void> {
  const { error } = await supabase.rpc('chat_group_report_message', {
    p_message_id: messageId,
    p_reason: reason,
  });

  if (error) throw chatRpcError('Could not report group message', error);
}
