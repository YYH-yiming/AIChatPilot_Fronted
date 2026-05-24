import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { FullscreenState } from '../../components/common/fullscreen-state';
import { AppShell } from '../shells/app-shell';
import { AuthShell } from '../shells/auth-shell';
import { ProtectedRoute } from './protected-route';
import { HomePage } from '../../pages/home/home-page';
import { LoginPage } from '../../pages/auth/login-page';
import { RegisterPage } from '../../pages/auth/register-page';

const KnowledgeListPage = lazy(async () => {
  const module = await import('../../pages/knowledge/knowledge-list-page');
  return { default: module.KnowledgeListPage };
});
const KnowledgeDetailPage = lazy(async () => {
  const module = await import('../../pages/knowledge/knowledge-detail-page');
  return { default: module.KnowledgeDetailPage };
});
const KnowledgeDebugPage = lazy(async () => {
  const module = await import('../../pages/knowledge/knowledge-debug-page');
  return { default: module.KnowledgeDebugPage };
});
const AgentDebugPage = lazy(async () => {
  const module = await import('../../pages/agent/agent-debug-page');
  return { default: module.AgentDebugPage };
});
const ChatSessionPage = lazy(async () => {
  const module = await import('../../pages/chat/chat-session-page');
  return { default: module.ChatSessionPage };
});
const AnalyticsDashboardPage = lazy(async () => {
  const module = await import('../../pages/analytics/analytics-dashboard-page');
  return { default: module.AnalyticsDashboardPage };
});
const SettingsLayoutPage = lazy(async () => {
  const module = await import('../../pages/settings/settings-layout-page');
  return { default: module.SettingsLayoutPage };
});
const SettingsProfilePage = lazy(async () => {
  const module = await import('../../pages/settings/settings-profile-page');
  return { default: module.SettingsProfilePage };
});
const SettingsTenantPage = lazy(async () => {
  const module = await import('../../pages/settings/settings-tenant-page');
  return { default: module.SettingsTenantPage };
});

function withRouteSuspense(node: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <FullscreenState
          title="正在加载页面"
          description="系统正在按需加载当前模块。"
          loading
        />
      }
    >
      {node}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/home" replace />,
  },
  {
    element: <AuthShell />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'knowledge',
        element: withRouteSuspense(<KnowledgeListPage />),
      },
      {
        path: 'knowledge/:kbId',
        element: withRouteSuspense(<KnowledgeDetailPage />),
      },
      {
        path: 'knowledge/:kbId/debug',
        element: withRouteSuspense(<KnowledgeDebugPage />),
      },
      {
        path: 'agent',
        element: withRouteSuspense(<AgentDebugPage />),
      },
      {
        path: 'chat',
        element: withRouteSuspense(<ChatSessionPage />),
      },
      {
        path: 'chat/:sessionId',
        element: withRouteSuspense(<ChatSessionPage />),
      },
      {
        path: 'analytics',
        element: withRouteSuspense(<AnalyticsDashboardPage />),
      },
      {
        path: 'settings',
        element: withRouteSuspense(<SettingsLayoutPage />),
        children: [
          {
            index: true,
            element: <Navigate to="/app/settings/profile" replace />,
          },
          {
            path: 'profile',
            element: withRouteSuspense(<SettingsProfilePage />),
          },
          {
            path: 'tenant',
            element: withRouteSuspense(<SettingsTenantPage />),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/app/home" replace />,
  },
]);
