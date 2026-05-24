import { useAuthStore } from '../stores/auth-store';
import type {
  KnowledgeAskResponse,
  KnowledgeBase,
  KnowledgeBasePayload,
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeSearchPayload,
  KnowledgeSearchResult,
} from '../types/knowledge';
import { request } from '../utils/request';
import { RequestError } from '../utils/request';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

export function getKnowledgeBases() {
  return request<KnowledgeBase[]>('/api/knowledge/bases');
}

export function getKnowledgeBaseById(id: number) {
  return request<KnowledgeBase>(`/api/knowledge/bases/${id}`);
}

export function createKnowledgeBase(payload: KnowledgeBasePayload) {
  return request<KnowledgeBase>('/api/knowledge/bases', {
    method: 'POST',
    body: payload,
  });
}

export function updateKnowledgeBase(
  id: number,
  payload: KnowledgeBasePayload,
) {
  return request<KnowledgeBase>(`/api/knowledge/bases/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteKnowledgeBase(id: number) {
  return request<null>(`/api/knowledge/bases/${id}`, {
    method: 'DELETE',
  });
}

export function getKnowledgeDocuments(kbId: number) {
  return request<KnowledgeDocument[]>(`/api/knowledge/bases/${kbId}/documents`);
}

export function getKnowledgeDocument(kbId: number, docId: number) {
  return request<KnowledgeDocument>(
    `/api/knowledge/bases/${kbId}/documents/${docId}`,
  );
}

export function getKnowledgeDocumentChunks(kbId: number, docId: number) {
  return request<KnowledgeChunk[]>(
    `/api/knowledge/bases/${kbId}/documents/${docId}/chunks`,
  );
}

export function searchKnowledgeBase(kbId: number, payload: KnowledgeSearchPayload) {
  return request<KnowledgeSearchResult[]>(
    `/api/knowledge/bases/${kbId}/search`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export function askKnowledgeBase(kbId: number, payload: KnowledgeSearchPayload) {
  return request<KnowledgeAskResponse>(`/api/knowledge/bases/${kbId}/ask`, {
    method: 'POST',
    body: payload,
  });
}

export async function uploadKnowledgeDocument(kbId: number, file: File) {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/knowledge/bases/${kbId}/documents/upload`,
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

  if (!response.ok) {
    throw new RequestError(
      payload?.message || `上传失败，状态码 ${response.status}`,
      response.status,
      payload?.code,
    );
  }

  if (!payload || payload.code !== 200) {
    throw new RequestError(payload?.message || '上传失败', response.status, payload?.code);
  }

  return payload.data as KnowledgeDocument;
}
