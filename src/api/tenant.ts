import type { TenantInfo, TenantUpdatePayload } from '../types/tenant';
import { request } from '../utils/request';

export function getTenantById(tenantId: number | string) {
  return request<TenantInfo>(`/api/tenant/${tenantId}`);
}

export function updateTenantById(
  tenantId: number | string,
  payload: TenantUpdatePayload,
) {
  return request<TenantInfo>(`/api/tenant/${tenantId}`, {
    method: 'PUT',
    body: payload,
  });
}
