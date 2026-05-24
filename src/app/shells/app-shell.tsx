import {
  ApartmentOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  HomeOutlined,
  RobotOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth-store';

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: '/app/home', icon: <HomeOutlined />, label: '总览' },
  { key: '/app/knowledge', icon: <DatabaseOutlined />, label: '知识库' },
  { key: '/app/agent', icon: <RobotOutlined />, label: 'Agent' },
  { key: '/app/chat', icon: <MessageOutlined />, label: '会话中心' },
  { key: '/app/analytics', icon: <BarChartOutlined />, label: '分析看板' },
  { key: '/app/settings', icon: <SettingOutlined />, label: '系统设置' },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const sessionUsername = useAuthStore((state) => state.username);
  const user = useAuthStore((state) => state.user);

  const activeKey = useMemo(() => {
    const matched = navItems.find((item) =>
      location.pathname.startsWith(item.key),
    );
    return matched?.key ?? '/app/home';
  }, [location.pathname]);

  const username = user?.username ?? sessionUsername ?? '未知用户';
  const role = user?.role ?? '业务成员';

  return (
    <Layout className="app-shell">
      <Sider width={248} theme="light" className="app-shell__sider">
        <div className="app-shell__brand">
          <div className="app-shell__brand-mark">
            <ApartmentOutlined />
          </div>
          <div>
            <Typography.Title level={4}>AIChatPilot</Typography.Title>
            <Typography.Text type="secondary">
              Knowledge Workspace
            </Typography.Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
          className="app-shell__menu"
        />
        <div className="app-shell__sider-footer">
          <Tag bordered={false} color="cyan">
            认证骨架已就绪
          </Tag>
          <Typography.Paragraph type="secondary">
            后续里程碑将在这里接入知识库、检索调试、Agent 与会话中心。
          </Typography.Paragraph>
        </div>
      </Sider>
      <Layout>
        <Header className="app-shell__header">
          <div>
            <Typography.Text type="secondary">当前路径</Typography.Text>
            <Typography.Title level={5}>{location.pathname}</Typography.Title>
          </div>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'profile',
                  label: '当前仅保留本地退出',
                  disabled: true,
                },
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  onClick: () => {
                    clearAuth();
                    navigate('/login', { replace: true });
                  },
                },
              ],
            }}
          >
            <Button type="text" className="app-shell__user-button">
              <Space size={12}>
                <Avatar>{username.slice(0, 1).toUpperCase()}</Avatar>
                <span className="app-shell__user-meta">
                  <strong>{username}</strong>
                  <small>{role}</small>
                </span>
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content className="app-shell__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
