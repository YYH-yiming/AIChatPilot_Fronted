import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
} from 'antd';
import { useEffect } from 'react';

import { getTenantById, updateTenantById } from '../../api/tenant';
import { ContentState } from '../../components/common/content-state';
import { useAuthStore } from '../../stores/auth-store';
import type { TenantInfo, TenantUpdatePayload } from '../../types/tenant';

type TenantFormValues = {
  name: string;
  apiKeyConfig: string;
  modelConfig: string;
  maxQps: number;
  status: number;
};

function toFormValues(tenant: TenantInfo): TenantFormValues {
  return {
    name: tenant.name ?? '',
    apiKeyConfig: tenant.apiKeyConfig ?? '',
    modelConfig: tenant.modelConfig ?? '',
    maxQps: tenant.maxQps ?? 0,
    status: tenant.status ?? 0,
  };
}

export function SettingsTenantPage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const tenantId = useAuthStore((state) => state.tenantId);
  const queryClient = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ['settings-tenant', tenantId],
    queryFn: () => getTenantById(tenantId as number),
    enabled: Boolean(tenantId),
  });

  useEffect(() => {
    if (tenantQuery.data) {
      form.setFieldsValue(toFormValues(tenantQuery.data));
    }
  }, [form, tenantQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: TenantUpdatePayload) =>
      updateTenantById(tenantId as number, payload),
    onSuccess: async () => {
      message.success('租户设置已保存');
      await queryClient.invalidateQueries({
        queryKey: ['settings-tenant', tenantId],
      });
    },
  });

  if (!tenantId) {
    return (
      <ContentState
        error
        title="缺少租户上下文"
        description="当前登录态没有可用的 tenantId，无法加载租户设置。"
      />
    );
  }

  if (tenantQuery.isLoading) {
    return (
      <ContentState
        loading
        title="正在加载租户设置"
        description="系统正在同步当前租户的配置信息。"
      />
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <ContentState
        error
        title="租户设置加载失败"
        description="请稍后重试，或检查租户接口是否可用。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => tenantQuery.refetch()}>
            重新加载
          </Button>
        }
      />
    );
  }

  const tenant = tenantQuery.data;

  const handleFinish = (values: TenantFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <Space direction="vertical" size={18} className="page-stack">
      <Card className="surface-card surface-card--muted" bordered={false}>
        <div className="section-heading">
          <Typography.Title level={4}>租户上下文</Typography.Title>
          <Typography.Text type="secondary">
            保存时按租户实体字段整体提交当前表单值，避免写入后端未定义字段。
          </Typography.Text>
        </div>
        <Space size={[12, 12]} wrap>
          <Typography.Text>租户 ID：{tenant.id}</Typography.Text>
          <Typography.Text>创建时间：{tenant.createdAt || '未返回'}</Typography.Text>
          <Typography.Text>更新时间：{tenant.updatedAt || '未返回'}</Typography.Text>
        </Space>
      </Card>

      <Card className="surface-card" bordered={false}>
        <div className="section-heading">
          <Typography.Title level={4}>租户配置</Typography.Title>
          <Typography.Text type="secondary">
            维护名称、密钥配置、模型配置、最大 QPS 和状态字段。
          </Typography.Text>
        </div>

        {saveMutation.isError ? (
          <Alert
            type="error"
            showIcon
            message="保存失败"
            description="请检查当前配置内容或稍后重试。"
            className="settings-form__alert"
          />
        ) : null}

        {saveMutation.isSuccess ? (
          <Alert
            type="success"
            showIcon
            message="保存成功"
            description="租户配置已提交，并已触发最新数据回填。"
            className="settings-form__alert"
          />
        ) : null}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            label="租户名称"
            name="name"
            rules={[{ required: true, message: '请输入租户名称' }]}
          >
            <Input placeholder="请输入租户名称" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="API Key 配置"
            name="apiKeyConfig"
            rules={[{ required: true, message: '请输入 API Key 配置' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="请输入租户级 API Key 配置文本"
            />
          </Form.Item>

          <Form.Item
            label="模型配置"
            name="modelConfig"
            rules={[{ required: true, message: '请输入模型配置' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入租户级模型配置文本"
            />
          </Form.Item>

          <div className="settings-form__grid">
            <Form.Item
              label="最大 QPS"
              name="maxQps"
              rules={[{ required: true, message: '请输入最大 QPS' }]}
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="状态"
              name="status"
              tooltip="接口文档未定义状态枚举，当前按数值状态直接维护。"
              rules={[{ required: true, message: '请输入状态值' }]}
            >
              <InputNumber precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              保存租户配置
            </Button>
            <Button
              onClick={() => form.setFieldsValue(toFormValues(tenant))}
              disabled={saveMutation.isPending}
            >
              恢复当前已加载值
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
