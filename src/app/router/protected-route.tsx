import { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullscreenState } from '../../components/common/fullscreen-state';
import { useAuthStore } from '../../stores/auth-store';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const hydrated = useAuthStore((state) => state.hydrated);
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);

  if (!hydrated || status === 'restoring' || (token && status === 'idle')) {
    return (
      <FullscreenState
        title="正在恢复登录态"
        description="系统正在校验本地凭据并同步当前用户信息。"
        loading
      />
    );
  }

  if (!token || status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children ?? <Outlet />;
}
