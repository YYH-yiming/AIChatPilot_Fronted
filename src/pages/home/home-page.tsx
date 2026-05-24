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
    description: '用于后续接入知识库 CRUD、文档上传与调试链路。',
    path: '/app/knowledge',
    icon: <DatabaseOutlined />,
  },
  {
    title: 'Agent 调试台',
    description: '保留独立 Agent 验证入口与工具调用呈现空间。',
    path: '/app/agent',
    icon: <RobotOutlined />,
  },
  {
    title: '会话中心',
    description: '后续用于接入普通消息与 SSE 事件式流。',
    path: '/app/chat',
    icon: <MessageOutlined />,
  },
  {
    title: '分析看板',
    description: '后续用于展示趋势、来源分布与性能指标。',
    path: '/app/analytics',
    icon: <BarChartOutlined />,
  },
  {
    title: '系统设置',
    description: '预留个人信息与租户设置位置。',
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
        description=""
        extra={<Tag color="green">认证主链路已打通</Tag>}
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
            <Typography.Title level={4}>当前阶段</Typography.Title>
            <Space direction="vertical" size={10}>
              <Tag color="cyan">基础骨架</Tag>
              <Typography.Paragraph>
                已具备登录、注册、受保护路由、登录态恢复与统一请求层。首页暂不拉取租户详情与业务指标。
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                后续任务可以直接在现有 Layout、Store、Query 与路由目录上扩展。
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <section>
        <div className="section-heading">
          <Typography.Title level={4}>页面入口</Typography.Title>
          <Typography.Text type="secondary">
            {/* 当前仅保留结构占位，不在本里程碑中实现业务细节。 */}
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
