import { Outlet } from 'react-router-dom';

const CAPABILITIES = [
  {
    title: '知识库构建',
    description: '上传文档、跟踪解析切片，沉淀可检索的企业知识。',
  },
  {
    title: '检索与问答验证',
    description: '对比 dense / sparse / hybrid 命中，确认回答是否基于引用。',
  },
  {
    title: 'Agent 与运营分析',
    description: '验证意图路由与工具调用，并观察趋势、来源与性能指标。',
  },
];

export function AuthShell() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <div className="auth-shell__intro">
          <span className="eyebrow">AIChatPilot</span>
          <h1>企业知识工作台</h1>
          <p>
            面向知识库构建、检索验证与链路诊断的统一工作入口，帮助团队稳定、高效、可信地运营企业知识与 AI 问答链路。
          </p>
        </div>
        <Outlet />
      </div>
      <aside className="auth-shell__aside">
        <div className="auth-shell__signal">
          <span className="eyebrow">平台能力</span>
          <h2>一个冷静、可判断的运营工作台</h2>
          <ul className="auth-shell__capabilities">
            {CAPABILITIES.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
