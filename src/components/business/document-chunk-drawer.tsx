import { Button, Drawer, Empty, Result, Skeleton, Space, Tag, Typography } from 'antd';

import type { KnowledgeChunk, KnowledgeDocument } from '../../types/knowledge';

type DocumentChunkDrawerProps = {
  open: boolean;
  document: KnowledgeDocument | null;
  chunks?: KnowledgeChunk[];
  loading?: boolean;
  error?: boolean;
  onClose: () => void;
  onRetry: () => void;
};

function formatDateTime(value?: string) {
  if (!value) {
    return '未记录';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function DocumentChunkDrawer({
  open,
  document,
  chunks,
  loading = false,
  error = false,
  onClose,
  onRetry,
}: DocumentChunkDrawerProps) {
  return (
    <Drawer
      width={720}
      open={open}
      title={document ? `Chunk 查看 · ${document.fileName}` : 'Chunk 查看'}
      onClose={onClose}
      destroyOnHidden
    >
      <Space direction="vertical" size={18} className="chunk-drawer">
        {document ? (
          <div className="chunk-drawer__summary">
            <Tag color="default">文档 ID {document.docId}</Tag>
            <Tag color="default">Chunk {document.chunkCount ?? 0}</Tag>
            <Typography.Text type="secondary">
              创建时间：{formatDateTime(document.createdAt)}
            </Typography.Text>
          </div>
        ) : null}

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : null}

        {!loading && error ? (
          <Result
            status="error"
            title="Chunk 加载失败"
            subTitle="请检查文档状态或稍后重新获取。"
            extra={
              <Button onClick={onRetry}>
                重新加载
              </Button>
            }
          />
        ) : null}

        {!loading && !error && (!chunks || chunks.length === 0) ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前文档暂无可展示的 chunk"
          />
        ) : null}

        {!loading && !error && chunks?.length ? (
          <div className="chunk-list">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="chunk-card">
                <div className="chunk-card__header">
                  <Space size={8} wrap>
                    <Tag color="cyan">Chunk #{chunk.chunkIndex}</Tag>
                    <Tag color="default">Token {chunk.tokenCount ?? 0}</Tag>
                  </Space>
                  <Typography.Text type="secondary">
                    {formatDateTime(chunk.createdAt)}
                  </Typography.Text>
                </div>
                <Typography.Paragraph className="chunk-card__content">
                  {chunk.content || '无正文内容'}
                </Typography.Paragraph>
                <Typography.Paragraph type="secondary" className="chunk-card__meta">
                  {chunk.metadata || '无元数据'}
                </Typography.Paragraph>
              </div>
            ))}
          </div>
        ) : null}
      </Space>
    </Drawer>
  );
}
