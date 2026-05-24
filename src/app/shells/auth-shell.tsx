import { Outlet } from 'react-router-dom';

export function AuthShell() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <div className="auth-shell__intro">
          <span className="eyebrow">AIChatPilot</span>
          <h1>企业知识工作台</h1>
          <p>
            面向知识库构建、检索验证与链路诊断的统一前端入口。当前阶段优先打通认证与基础骨架。
          </p>
        </div>
        <Outlet />
      </div>
      <aside className="auth-shell__aside">
        <div className="auth-shell__signal">
          <span className="eyebrow">Milestone 01</span>
          <h2>冷静、可判断的认证入口</h2>
          <p>
            使用克制的中性色底与紧凑布局，避免把登录页做成营销海报。重点是清楚、稳定和可信。
          </p>
        </div>
      </aside>
    </div>
  );
}
