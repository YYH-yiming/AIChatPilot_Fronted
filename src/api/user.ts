import type { UserInfo } from '../types/auth';
import { request } from '../utils/request';

export function getCurrentUserInfo() {
  return request<UserInfo>('/api/user/info');
}
