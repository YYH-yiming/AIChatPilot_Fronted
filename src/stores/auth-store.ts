import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { LoginResponse, UserInfo } from '../types/auth';

type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'anonymous';

type AuthState = {
  token: string | null;
  userId: number | null;
  tenantId: number | null;
  username: string | null;
  user: UserInfo | null;
  status: AuthStatus;
  hydrated: boolean;
  saveSession: (payload: LoginResponse) => void;
  syncUser: (user: UserInfo) => void;
  setRestoring: () => void;
  setAnonymous: () => void;
  clearAuth: () => void;
  markHydrated: () => void;
};

const initialState = {
  token: null,
  userId: null,
  tenantId: null,
  username: null,
  user: null,
  status: 'idle' as AuthStatus,
  hydrated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      saveSession: (payload) =>
        set({
          token: payload.token,
          userId: payload.userId,
          tenantId: payload.tenantId,
          username: payload.username,
          status: 'authenticated',
        }),
      syncUser: (user) =>
        set({
          user,
          userId: user.id,
          tenantId: user.tenantId,
          username: user.username,
          status: 'authenticated',
        }),
      setRestoring: () => set({ status: 'restoring' }),
      setAnonymous: () => set({ user: null, status: 'anonymous' }),
      clearAuth: () =>
        set({ ...initialState, hydrated: true, status: 'anonymous' }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'aichatpilot-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        tenantId: state.tenantId,
        username: state.username,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.status = state.token ? 'idle' : 'anonymous';
        state.markHydrated();
      },
    },
  ),
);
