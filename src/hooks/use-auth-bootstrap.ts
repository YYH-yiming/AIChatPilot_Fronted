import { useCallback } from 'react';

import { getCurrentUser } from '../api/auth';
import { useAuthStore } from '../stores/auth-store';

export function useAuthBootstrap() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const setAnonymous = useAuthStore((state) => state.setAnonymous);
  const setRestoring = useAuthStore((state) => state.setRestoring);
  const syncUser = useAuthStore((state) => state.syncUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useCallback(async () => {
    if (!hydrated) {
      return;
    }

    if (!token) {
      setAnonymous();
      return;
    }

    setRestoring();

    try {
      const user = await getCurrentUser();
      syncUser(user);
    } catch {
      clearAuth();
    }
  }, [clearAuth, hydrated, setAnonymous, setRestoring, syncUser, token]);
}
