import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { useEffect } from 'react';

import { getCurrentUserInfo } from '../../api/user';
import { ContentState } from '../../components/common/content-state';
import { useAuthStore } from '../../stores/auth-store';

function formatStatus(status?: number) {
  if (status === undefined || status === null) {
    return '未返回';
  }

  return String(status);
}

export function SettingsProfilePage() {
  const syncUser = useAuthStore((state) => state.syncUser);

  const profileQuery = useQuery({
    queryKey: ['settings-profile'],
    queryFn: getCurrentUserInfo,
  });

  useEffect(() => {
    if (profileQuery.data) {
      syncUser(profileQuery.data);
    }
  }, [profileQuery.data, syncUser]);

  if (profileQuery.isLoading) {
    return (
      <ContentState
        loading
        title="正在加载个人信息"
        description="系统正在同步当前登录用户的基础资料。"
      />
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ContentState
        error
        title="个人信息加载失败"
        description="请稍后重试，或检查 /api/user/info 是否可用。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => profileQuery.refetch()}>
            重新加载
          </Button>
        }
      />
    );
  }

  const user = profileQuery.data;

  return (
    <Space direction="vertical" size={18} className="page-stack">
      <Card className="surface-card" bordered={false}>
        <div className="section-heading">
          <Typography.Title level={4}>当前用户资料</Typography.Title>
          <Typography.Text type="secondary">
            该页面仅用于查看登录态对应的用户信息，不提供编辑能力。
          </Typography.Text>
        </div>
        <Descriptions column={2} size="middle" labelStyle={{ width: 120 }}>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="昵称">
            {user.nickname || '未填写'}
          </Descriptions.Item>
          <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="租户 ID">{user.tenantId}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{user.phone || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role || '未返回'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="default">{formatStatus(user.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {user.createdAt || '未返回'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
