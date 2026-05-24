import { Empty, Space, Tag, Typography } from 'antd';

import type { KnowledgeSearchResult } from '../../types/knowledge';

type KnowledgeReferenceListProps = {
  references?: KnowledgeSearchResult[];
};

function formatScore(value?: number | null) {
  if (value === null || value === undefined) {
    return '无';
  }

  return value.toFixed(4);
}

export function KnowledgeReferenceList({
  references,
}: KnowledgeReferenceListProps) {
  if (!references?.length) {
    return (
      <div className="knowledge-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="当前回答没有引用资料"
        />
      </div>
    );
  }

  return (
    <Space direction="vertical" size={14} className="reference-list">
      {references.map((reference) => (
        <div
          key={`${reference.docId}-${reference.chunkId}-${reference.chunkIndex}`}
          className="reference-card"
        >
          <div className="reference-card__header">
            <Space size={8} wrap>
              <Tag color="cyan">Doc {reference.docId}</Tag>
              <Tag color="default">ChunkId {reference.chunkId}</Tag>
              <Tag color="default">Chunk {reference.chunkIndex}</Tag>
              <Tag color="default">Source {reference.source || '未知'}</Tag>
            </Space>
            <Space size={8} wrap>
              <Tag color="default">Score {formatScore(reference.score)}</Tag>
              <Tag color="default">
                Dense {formatScore(reference.denseScore)}
              </Tag>
              <Tag color="default">
                Sparse {formatScore(reference.sparseScore)}
              </Tag>
            </Space>
          </div>
          <Typography.Paragraph className="reference-card__content">
            {reference.content || '无引用内容'}
          </Typography.Paragraph>
        </div>
      ))}
    </Space>
  );
}
