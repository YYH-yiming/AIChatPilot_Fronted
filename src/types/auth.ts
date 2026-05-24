export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  password: string;
  email?: string;
  tenantName?: string;
};

export type LoginResponse = {
  token: string;
  userId: number;
  username: string;
  tenantId: number;
};

export type UserInfo = {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  role?: string;
  tenantId: number;
  status?: number;
  createdAt?: string;
};
