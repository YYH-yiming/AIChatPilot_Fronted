import type { AgentChatPayload, AgentChatResponse } from '../types/agent';
import { request } from '../utils/request';

export function chatWithAgent(payload: AgentChatPayload) {
  return request<AgentChatResponse>('/api/agent/chat', {
    method: 'POST',
    body: payload,
  });
}
