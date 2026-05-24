export type TenantInfo = {
  id: number;
  name?: string;
  apiKeyConfig?: string;
  modelConfig?: string;
  maxQps?: number;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantUpdatePayload = {
  name: string;
  apiKeyConfig: string;
  modelConfig: string;
  maxQps: number;
  status: number;
};
