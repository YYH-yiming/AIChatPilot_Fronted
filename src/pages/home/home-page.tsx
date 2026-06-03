import {
  ArrowRightOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { ContentState } from '../../components/common/content-state';
import { PageHeader } from '../../components/common/page-header';
import { useAuthStore } from '../../stores/auth-store';

const entries = [
  {
    title: '知识库管理',
    description: '管理知识库与文档，跟踪解析、切片与索引状态。',
    path: '/app/knowledge',
    icon: <DatabaseOutlined />,
  },
  {
    title: 'Agent 调试台',
    description: '验证意图路由、知识库绑定与工具调用效果。',
    path: '/app/agent',
    icon: <RobotOutlined />,
  },
  {
    title: '会话中心',
    description: '管理会话历史，支持知识库与 Agent 两种问答模式。',
    path: '/app/chat',
    icon: <MessageOutlined />,
  },
  {
    title: '分析看板',
    description: '查看会话趋势、来源分布、意图分布与性能指标。',
    path: '/app/analytics',
    icon: <BarChartOutlined />,
  },
  {
    title: '系统设置',
    description: '查看个人信息，维护租户名称、模型与密钥配置。',
    path: '/app/settings',
    icon: <SettingOutlined />,
  },
];

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return (
      <ContentState
        loading
        title="正在加载首页"
        description="系统正在恢复你的工作台上下文。"
      />
    );
  }

  if (!user) {
    return (
      <ContentState
        error
        title="未能加载首页"
        description="当前没有可用的用户信息，请重新登录后重试。"
      />
    );
  }

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Workspace"
        title={`欢迎回来，${user.nickname || user.username}`}
        description="从这里进入知识库、检索调试、Agent、会话中心与分析看板。"
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={15}>
          <Card className="surface-card" bordered={false}>
            <Typography.Title level={4}>当前用户信息</Typography.Title>
            <Descriptions column={2} size="middle" labelStyle={{ width: 108 }}>
              <Descriptions.Item label="用户名">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                {user.role || '未返回'}
              </Descriptions.Item>
              <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
              <Descriptions.Item label="租户 ID">
                {user.tenantId}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {user.email || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                {user.phone || '未填写'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="surface-card surface-card--muted" bordered={false}>
            <Typography.Title level={4}>快速开始</Typography.Title>
            <Space direction="vertical" size={10}>
              <Tag color="cyan">三步上手</Tag>
              <Typography.Paragraph>
                1. 在「知识库」中创建知识库并上传文档；2. 进入「检索调试」验证命中与回答；3. 在「会话中心」或「Agent 调试台」中实际问答。
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                各模块也可从左侧导航或下方入口直接进入。
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <section>
        <div className="section-heading">
          <Typography.Title level={4}>页面入口</Typography.Title>
          <Typography.Text type="secondary">
            选择一个模块进入对应的工作台。
          </Typography.Text>
        </div>
        <Row gutter={[18, 18]}>
          {entries.map((entry) => (
            <Col xs={24} md={12} xl={8} key={entry.path}>
              <Card className="entry-card" bordered={false}>
                <Space direction="vertical" size={14}>
                  <span className="entry-card__icon">{entry.icon}</span>
                  <Typography.Title level={5}>{entry.title}</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    {entry.description}
                  </Typography.Paragraph>
                  <Button type="default" icon={<ArrowRightOutlined />}>
                    <Link to={entry.path}>跳转页面</Link>
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Space>
  );
}
