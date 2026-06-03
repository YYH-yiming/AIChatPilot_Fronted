import type { ApiResult } from '../types/api';
import { useAuthStore } from '../stores/auth-store';
import { notifyError } from './message';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export class RequestError extends Error {
  status: number;
  code?: number;

  constructor(messageText: string, status: number, code?: number) {
    super(messageText);
    this.name = 'RequestError';
    this.status = status;
    this.code = code;
  }
}

function resolveErrorMessage(status: number, fallback: string) {
  if (status === 401) {
    return '登录已失效，请重新登录';
  }

  if (status === 429) {
    return '请求过于频繁，请稍后重试';
  }

  if (status >= 500) {
    return '服务暂时不可用，请稍后重试';
  }

  return fallback;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const payload = isJson
    ? ((await response.json()) as ApiResult<T>)
    : null;

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    notifyError('登录已过期，请重新登录');
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (window.location.pathname !== '/login') {
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    throw new RequestError('登录已过期，请重新登录', 401, payload?.code);
  }

  if (!response.ok) {
    const fallback = payload?.message || `请求失败，状态码 ${response.status}`;
    const errorMessage = resolveErrorMessage(response.status, fallback);

    if (response.status === 429 || response.status >= 500) {
      notifyError(errorMessage);
    }

    throw new RequestError(errorMessage, response.status, payload?.code);
  }

  if (!payload) {
    throw new RequestError('接口返回格式无效', response.status);
  }

  if (payload.code !== 200) {
    throw new RequestError(payload.message || '业务请求失败', response.status, payload.code);
  }

  return payload.data;
}
