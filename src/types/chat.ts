import type { KnowledgeSearchResult } from './knowledge';

export type ChatMode = 'knowledge' | 'agent';

export type ChatSession = {
  sessionId: number;
  title: string;
  mode: ChatMode;
  kbId?: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
};

export type ChatMessage = {
  messageId: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  answerSource?: string;
  intent?: string;
  kbId?: number;
  tokenUsed?: number;
  durationMs?: number;
  createdAt?: string;
  references?: KnowledgeSearchResult[];
  rewrittenQuery?: string;
  grounded?: boolean;
  referenceCount?: number;
  toolsCalled?: string[];
};

export type ChatSessionDetail = {
  session: ChatSession;
  messages: ChatMessage[];
};

export type CreateChatSessionPayload = {
  title?: string;
  mode?: ChatMode;
  kbId?: number;
};

export type SendChatMessagePayload = {
  content: string;
  topK?: number;
};

export type ChatReply = {
  sessionId: number;
  userMessageId: number;
  assistantMessageId: number;
  mode: ChatMode;
  answerSource?: string;
  answer: string;
  rewrittenQuery?: string;
  intent?: string;
  kbId?: number;
  topK?: number;
  grounded?: boolean;
  referenceCount?: number;
  tokenUsed?: number;
  durationMs?: number;
  toolsCalled?: string[];
  references?: KnowledgeSearchResult[];
};

export type ChatStreamStartEvent = {
  sessionId: number;
};

/**
 * 真流式 `meta` 事件：检索完成、开始生成时下发一次。字段与 ChatReply 的检索元信息一致（无 answer）。
 * 假流式不发此事件。
 */
export type ChatStreamMetaEvent = {
  mode?: ChatMode;
  answerSource?: string;
  kbId?: number;
  topK?: number;
  grounded?: boolean;
  referenceCount?: number;
  rewrittenQuery?: string;
  references?: KnowledgeSearchResult[];
};

/** 真流式 `token` 事件：一个答案增量。假流式不发此事件（整段走 `reply`）。 */
export type ChatStreamTokenEvent = {
  text: string;
};

export type ChatStreamDoneEvent = {
  status: string;
  // 后端 doneData 现同时下发以下字段（真/假流式都有），真流式据此拼最终消息。
  sessionId?: number;
  userMessageId?: number;
  assistantMessageId?: number;
  durationMs?: number;
};

export type ChatStreamErrorEvent = {
  message?: string;
};
