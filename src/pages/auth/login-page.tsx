import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography, message } from 'antd';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getCurrentUser, login } from '../../api/auth';
import { useAuthStore } from '../../stores/auth-store';
import type { LoginPayload } from '../../types/auth';

type LoginFormValues = LoginPayload & {
  remember: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const saveSession = useAuthStore((state) => state.saveSession);
  const syncUser = useAuthStore((state) => state.syncUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const stateFrom =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : null;
  const from = stateFrom ?? searchParams.get('redirect') ?? '/app/home';

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const session = await login(payload);
      saveSession(session);
      const user = await getCurrentUser();
      syncUser(user);
      return user;
    },
    onSuccess: () => {
      message.success('登录成功，正在进入工作台');
      navigate(from, { replace: true });
    },
    onError: () => {
      clearAuth();
    },
  });

  const onFinish = (values: LoginFormValues) => {
    loginMutation.mutate({
      username: values.username.trim(),
      password: values.password,
    });
  };

  return (
    <Card className="auth-card" bordered={false}>
      <Space direction="vertical" size={20} className="auth-card__stack">
        <div>
          <Typography.Title level={3}>登录</Typography.Title>
          <Typography.Paragraph type="secondary">
            使用已有账号进入工作台，系统会在登录后同步当前用户信息。
          </Typography.Paragraph>
        </div>

        {loginMutation.isError ? (
          <Alert
            type="error"
            showIcon
            message="登录失败"
            description="请检查用户名、密码或当前网关服务状态。"
          />
        ) : null}

        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 个字符' },
            ]}
          >
            <Input.Password
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox disabled>保持登录（当前版本默认开启）</Checkbox>
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            loading={loginMutation.isPending}
          >
            登录
          </Button>
        </Form>

        <Typography.Text type="secondary">
          还没有账号？<Link to="/register">创建初始租户并注册</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
}
