import { Card, Space, Tag, Typography } from 'antd';

import { PageHeader } from '../../components/common/page-header';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Placeholder"
        title={title}
        description={description}
      />
      <Card className="surface-card surface-card--muted" bordered={false}>
        <Space direction="vertical" size={12}>
          <Tag color="default">待后续里程碑实现</Tag>
          <Typography.Paragraph>
            当前页面仅用于验证路由结构、全局 Layout 与导航边界，不包含业务接口调用或假数据功能。
          </Typography.Paragraph>
        </Space>
      </Card>
    </Space>
  );
}
