import { Tag } from 'antd';

import type { KnowledgeDocumentParseStatus } from '../../types/knowledge';

const STATUS_META: Record<
  KnowledgeDocumentParseStatus,
  {
    color: string;
    label: string;
  }
> = {
  0: {
    color: 'default',
    label: '排队中',
  },
  1: {
    color: 'processing',
    label: '处理中',
  },
  2: {
    color: 'success',
    label: '已完成',
  },
  3: {
    color: 'error',
    label: '失败',
  },
};

export function DocumentParseStatusTag({
  status,
}: {
  status: KnowledgeDocumentParseStatus;
}) {
  const meta = STATUS_META[status] ?? {
    color: 'gold',
    label: `状态 ${status}`,
  };

  return (
    <Tag color={meta.color} bordered={false}>
      {meta.label}
    </Tag>
  );
}
