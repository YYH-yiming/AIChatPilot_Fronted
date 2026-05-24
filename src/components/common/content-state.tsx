import { Empty, Result, Skeleton, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

type ContentStateProps = {
  title: string;
  description: string;
  loading?: boolean;
  error?: boolean;
  action?: ReactNode;
};

export function ContentState({
  title,
  description,
  loading = false,
  error = false,
  action,
}: ContentStateProps) {
  if (loading) {
    return (
      <div className="content-state">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title={title}
        subTitle={description}
        extra={action}
        className="content-state"
      />
    );
  }

  return (
    <Space
      direction="vertical"
      align="center"
      size={12}
      className="content-state"
    >
      <Empty description={false} />
      <Typography.Title level={5}>{title}</Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
      {action}
    </Space>
  );
}
