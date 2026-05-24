import { Result, Space, Spin, Typography } from 'antd';

type FullscreenStateProps = {
  title: string;
  description: string;
  loading?: boolean;
};

export function FullscreenState({
  title,
  description,
  loading = false,
}: FullscreenStateProps) {
  return (
    <div className="fullscreen-state">
      {loading ? (
        <Space direction="vertical" align="center" size={18}>
          <Spin size="large" />
          <Typography.Title level={4}>{title}</Typography.Title>
          <Typography.Text type="secondary">{description}</Typography.Text>
        </Space>
      ) : (
        <Result status="info" title={title} subTitle={description} />
      )}
    </div>
  );
}
