import { Segmented, Space } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { PageHeader } from '../../components/common/page-header';

const SETTING_ITEMS = [
  { label: '个人信息', value: '/app/settings/profile' },
  { label: '租户设置', value: '/app/settings/tenant' },
] as const;

export function SettingsLayoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeValue =
    SETTING_ITEMS.find((item) => location.pathname.startsWith(item.value))
      ?.value ?? '/app/settings/profile';

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="系统设置"
        description="查看当前用户信息，并维护租户级名称、模型配置、密钥配置与吞吐限制。"
        extra={
          <Segmented
            options={SETTING_ITEMS}
            value={activeValue}
            onChange={(value: string | number) => navigate(String(value))}
          />
        }
      />
      <Outlet />
    </Space>
  );
}
