import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../../api/auth';
import type { RegisterPayload } from '../../types/auth';

export function RegisterPage() {
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      message.success('注册成功，请使用新账号登录');
      navigate('/login', { replace: true });
    },
  });

  return (
    <Card className="auth-card" bordered={false}>
      <Space direction="vertical" size={20} className="auth-card__stack">
        <div>
          <Typography.Title level={3}>注册</Typography.Title>
          <Typography.Paragraph type="secondary">
            创建新的用户账号与初始租户。当前版本注册成功后不会自动登录。
          </Typography.Paragraph>
        </div>

        {registerMutation.isError ? (
          <Alert
            type="error"
            showIcon
            message="注册失败"
            description="请检查输入内容，或确认网关与用户服务是否可用。"
          />
        ) : null}

        <Form<RegisterPayload> layout="vertical" onFinish={registerMutation.mutate}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
              { max: 50, message: '用户名不能超过 50 个字符' },
            ]}
          >
            <Input placeholder="例如：ops_admin" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 个字符' },
              { max: 50, message: '密码不能超过 50 个字符' },
            ]}
          >
            <Input.Password
              placeholder="至少 6 位字符"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效邮箱' }]}
          >
            <Input placeholder="可选，用于后续通知" autoComplete="email" />
          </Form.Item>
          <Form.Item label="初始租户名称" name="tenantName">
            <Input placeholder="例如：默认租户" />
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            loading={registerMutation.isPending}
          >
            注册并返回登录
          </Button>
        </Form>

        <Typography.Text type="secondary">
          已有账号？<Link to="/login">返回登录</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
}
