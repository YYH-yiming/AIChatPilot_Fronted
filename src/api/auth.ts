import type { LoginPayload, LoginResponse, RegisterPayload, UserInfo } from '../types/auth';
import { getCurrentUserInfo } from './user';
import { request } from '../utils/request';

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/api/user/login', {
    method: 'POST',
    body: payload,
  });
}

export function register(payload: RegisterPayload) {
  return request<null>('/api/user/register', {
    method: 'POST',
    body: payload,
  });
}

export function getCurrentUser() {
  return getCurrentUserInfo();
}
