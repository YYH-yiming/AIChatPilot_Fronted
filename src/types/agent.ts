import type { KnowledgeSearchResult } from './knowledge';

export type AgentChatPayload = {
  query: string;
  kbId?: number;
  sessionId?: number;
};

export type AgentIntent =
  | 'faq'
  | 'policy'
  | 'order'
  | 'ticket'
  | 'escalation'
  | string;

export type AgentChatResponse = {
  answer: string;
  agentName?: string;
  toolsCalled?: string[];
  tokenUsed?: number;
  durationMs?: number;
  intent?: AgentIntent;
  confidence?: number;
  kbId?: number;
  sessionId?: number;
  references?: KnowledgeSearchResult[];
};
