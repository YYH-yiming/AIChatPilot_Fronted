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
  ChatStreamRecognizedEvent,
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

export type StreamChatHandlers = {
  onStart?: (payload: ChatStreamStartEvent) => void;
  onRecognized?: (payload: ChatStreamRecognizedEvent) => void;
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

function handleSseEvent(
  event: string,
  data: string,
  handlers: StreamChatHandlers,
) {
  const parsedPayload = JSON.parse(data || '{}');
  switch (event) {
    case 'start':
      handlers.onStart?.(parsedPayload as ChatStreamStartEvent);
      break;
    case 'recognized':
      handlers.onRecognized?.(parsedPayload as ChatStreamRecognizedEvent);
      break;
    case 'meta':
      handlers.onMeta?.(parsedPayload as ChatStreamMetaEvent);
      break;
    case 'token':
      handlers.onToken?.(parsedPayload as ChatStreamTokenEvent);
      break;
    case 'reply':
      handlers.onReply?.(parsedPayload as ChatReply);
      break;
    case 'done':
      handlers.onDone?.(parsedPayload as ChatStreamDoneEvent);
      break;
    case 'error':
      handlers.onError?.(parsedPayload as ChatStreamErrorEvent);
      break;
    default:
      break;
  }
}

// 读取 SSE 响应体并分发事件（文本/语音/图像流式共用）。
async function consumeSse(response: Response, handlers: StreamChatHandlers) {
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
        parseSseChunk(`${part}\n\n`).forEach((item) =>
          handleSseEvent(item.event, item.data, handlers),
        );
      }
    }

    if (buffer.trim()) {
      parseSseChunk(buffer).forEach((item) => {
        if (item.event === 'done') {
          handlers.onDone?.(JSON.parse(item.data || '{}') as ChatStreamDoneEvent);
        }
      });
    }
  } finally {
    reader.releaseLock();
  }
}

// 发起一个 SSE POST 流：统一处理 401 跳登录、非 2xx 报错，再交给 consumeSse 分发。
async function openSseStream(
  path: string,
  init: RequestInit,
  handlers: StreamChatHandlers,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

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

  await consumeSse(response, handlers);
}

export async function streamChatMessage(
  sessionId: number,
  payload: SendChatMessagePayload,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
) {
  const token = useAuthStore.getState().token;
  await openSseStream(
    `/api/chat/sessions/${sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    },
    handlers,
  );
}

function audioFilename(audio: Blob) {
  const type = audio.type || '';
  if (type.includes('webm')) return 'voice.webm';
  if (type.includes('mp4') || type.includes('m4a')) return 'voice.mp4';
  if (type.includes('ogg')) return 'voice.ogg';
  if (type.includes('wav')) return 'voice.wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'voice.mp3';
  return 'voice.webm';
}

// 语音：上传音频(FormData) 并 SSE 流式返回（先 recognized=转写文本，再逐 token 答案）。
export async function streamChatAudioMessage(
  sessionId: number,
  audio: Blob,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
  topK?: number,
) {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', audio, audioFilename(audio));
  if (topK != null) {
    formData.append('topK', String(topK));
  }
  await openSseStream(
    `/api/chat/sessions/${sessionId}/messages/audio/stream`,
    {
      method: 'POST',
      // 不要手动设 Content-Type：浏览器需自动注入 multipart boundary。
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
      signal,
    },
    handlers,
  );
}

// 语音：同步返回（转写 → 问答 → 完整 ChatReply，含 recognizedText）。
export async function sendChatAudioMessage(
  sessionId: number,
  audio: Blob,
  topK?: number,
) {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', audio, audioFilename(audio));
  if (topK != null) {
    formData.append('topK', String(topK));
  }

  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages/audio`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
  );

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    if (window.location.pathname !== '/login') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    throw new RequestError('登录已失效，请重新登录', 401, payload?.code);
  }

  if (!response.ok || !payload || payload.code !== 200) {
    throw new RequestError(
      payload?.message || `语音消息失败，状态码 ${response.status}`,
      response.status,
      payload?.code,
    );
  }

  return payload.data as ChatReply;
}

// 图像：上传图片(FormData，可带文字) 并 SSE 流式返回（先 recognized=识别文本，再逐 token 答案）。
export async function streamChatImageMessage(
  sessionId: number,
  image: File,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
  text?: string,
  topK?: number,
) {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', image, image.name || 'image.png');
  if (text) {
    formData.append('text', text);
  }
  if (topK != null) {
    formData.append('topK', String(topK));
  }
  await openSseStream(
    `/api/chat/sessions/${sessionId}/messages/image/stream`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
      signal,
    },
    handlers,
  );
}

// 图像：同步返回（VLM识别 → 问答 → 完整 ChatReply，含 recognizedText）。
export async function sendChatImageMessage(
  sessionId: number,
  image: File,
  text?: string,
  topK?: number,
) {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', image, image.name || 'image.png');
  if (text) {
    formData.append('text', text);
  }
  if (topK != null) {
    formData.append('topK', String(topK));
  }

  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages/image`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
  );

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    if (window.location.pathname !== '/login') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    throw new RequestError('登录已失效，请重新登录', 401, payload?.code);
  }

  if (!response.ok || !payload || payload.code !== 200) {
    throw new RequestError(
      payload?.message || `图片消息失败，状态码 ${response.status}`,
      response.status,
      payload?.code,
    );
  }

  return payload.data as ChatReply;
}
