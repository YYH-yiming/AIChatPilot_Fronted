# AIChatPilot Frontend

企业知识工作台前端，覆盖登录、知识库管理、检索调试、Agent 调试、Chat 会话中心、Analytics 看板和基础设置页。

## 启动

环境要求：

- Node.js 22+
- npm 11+

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 环境变量

项目通过 `VITE_API_BASE_URL` 指向后端网关。

示例：

```env
VITE_API_BASE_URL=http://localhost:8080
```

可参考：

- [.env.example](./.env.example)

建议本地新建 `.env.local` 后再修改。

## 主要页面

- `/login`：登录
- `/register`：注册
- `/app/home`：首页
- `/app/knowledge`：知识库列表
- `/app/knowledge/:kbId`：知识库详情
- `/app/knowledge/:kbId/debug`：检索调试页
- `/app/agent`：Agent 调试台
- `/app/chat`：会话中心
- `/app/chat/:sessionId`：会话详情
- `/app/analytics`：分析看板
- `/app/settings/profile`：个人信息
- `/app/settings/tenant`：租户设置

## 联调说明

- 前端所有请求统一走网关
- 默认网关地址：`http://localhost:8080`
- `/app/*` 页面需要先登录

## 文档

更完整的启动和页面说明见：

- [docs/前端启动与页面导航说明.md](./docs/前端启动与页面导航说明.md)
