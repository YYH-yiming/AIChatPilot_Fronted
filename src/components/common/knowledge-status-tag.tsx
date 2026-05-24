import { Tag } from 'antd';

type KnowledgeStatusTagProps = {
  status: number;
};

const STATUS_META: Record<
  number,
  {
    color: string;
    label: string;
  }
> = {
  0: {
    color: 'default',
    label: '停用',
  },
  1: {
    color: 'green',
    label: '启用',
  },
  2: {
    color: 'processing',
    label: '处理中',
  },
};

export function KnowledgeStatusTag({ status }: KnowledgeStatusTagProps) {
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
