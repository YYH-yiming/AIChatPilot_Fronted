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

export type ChatStreamDoneEvent = {
  status: string;
};

export type ChatStreamErrorEvent = {
  message?: string;
};
