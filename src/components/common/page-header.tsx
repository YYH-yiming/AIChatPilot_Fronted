import { Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  extra?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  extra,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <Space size={10} align="center">
          {eyebrow ? <Tag color="cyan">{eyebrow}</Tag> : null}
        </Space>
        <Typography.Title level={2}>{title}</Typography.Title>
        {description ? (
          <Typography.Paragraph>{description}</Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <div>{extra}</div> : null}
    </div>
  );
}
