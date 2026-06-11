import { useAuthStore } from '../stores/auth-store';
import type { PageResult } from '../types/api';
import type {
  ChatMessage,
  ChatReply,
  ChatSession,
  ChatSessionDetail,
  ChatStreamDoneEvent,
  ChatStreamErrorEvent,
  ChatStreamMetaEvent,
  ChatStreamStartEvent,
  ChatStreamTokenEvent,
  CreateChatSessionPayload,
  SendChatMessagePayload,
} from '../types/chat';
import { request } from '../utils/request';
import { RequestError } from '../utils/request';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

export function createChatSession(payload: CreateChatSessionPayload) {
  return request<ChatSession>('/api/chat/sessions', {
    method: 'POST',
    body: payload,
  });
}

export function getChatSessions(pageNum = 1, pageSize = 20) {
  return request<PageResult<ChatSession>>(
    `/api/chat/sessions?pageNum=${pageNum}&pageSize=${pageSize}`,
  );
}

export function getChatSessionDetail(sessionId: number, messageLimit = 20) {
  return request<ChatSessionDetail>(
    `/api/chat/sessions/${sessionId}?messageLimit=${messageLimit}`,
  );
}

export function getChatMessages(sessionId: number, pageNum = 1, pageSize = 20) {
  return request<PageResult<ChatMessage>>(
    `/api/chat/sessions/${sessionId}/messages?pageNum=${pageNum}&pageSize=${pageSize}`,
  );
}

export function sendChatMessage(
  sessionId: number,
  payload: SendChatMessagePayload,
) {
  return request<ChatReply>(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: payload,
  });
}

export function closeChatSession(sessionId: number) {
  return request<null>(`/api/chat/sessions/${sessionId}/close`, {
    method: 'POST',
  });
}

type StreamChatHandlers = {
  onStart?: (payload: ChatStreamStartEvent) => void;
  onMeta?: (payload: ChatStreamMetaEvent) => void;
  onToken?: (payload: ChatStreamTokenEvent) => void;
  onReply?: (payload: ChatReply) => void;
  onDone?: (payload: ChatStreamDoneEvent) => void;
  onError?: (payload: ChatStreamErrorEvent) => void;
};

function parseSseChunk(chunk: string) {
  const blocks = chunk.split('\n\n');
  const events: Array<{ event: string; data: string }> = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean);

    if (!lines.length) {
      continue;
    }

    let event = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    events.push({
      event,
      data: dataLines.join('\n'),
    });
  }

  return events;
}

export async function streamChatMessage(
  sessionId: number,
  payload: SendChatMessagePayload,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
) {
  const token = useAuthStore.getState().token;
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    },
  );

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    if (window.location.pathname !== '/login') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    throw new RequestError('登录已失效，请重新登录', 401);
  }

  if (!response.ok) {
    throw new RequestError(`流式请求失败，状态码 ${response.status}`, response.status);
  }

  if (!response.body) {
    throw new RequestError('浏览器未返回可读事件流', response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const parsedEvents = parseSseChunk(`${part}\n\n`);
        parsedEvents.forEach((item) => {
          const payloadText = item.data || '{}';
          const parsedPayload = JSON.parse(payloadText);

          if (item.event === 'start') {
            handlers.onStart?.(parsedPayload as ChatStreamStartEvent);
            return;
          }

          if (item.event === 'meta') {
            handlers.onMeta?.(parsedPayload as ChatStreamMetaEvent);
            return;
          }

          if (item.event === 'token') {
            handlers.onToken?.(parsedPayload as ChatStreamTokenEvent);
            return;
          }

          if (item.event === 'reply') {
            handlers.onReply?.(parsedPayload as ChatReply);
            return;
          }

          if (item.event === 'done') {
            handlers.onDone?.(parsedPayload as ChatStreamDoneEvent);
            return;
          }

          if (item.event === 'error') {
            handlers.onError?.(parsedPayload as ChatStreamErrorEvent);
          }
        });
      }
    }

    if (buffer.trim()) {
      const parsedEvents = parseSseChunk(buffer);
      parsedEvents.forEach((item) => {
        const parsedPayload = JSON.parse(item.data || '{}');

        if (item.event === 'done') {
          handlers.onDone?.(parsedPayload as ChatStreamDoneEvent);
        }
      });
    }
  } finally {
    reader.releaseLock();
  }
}
