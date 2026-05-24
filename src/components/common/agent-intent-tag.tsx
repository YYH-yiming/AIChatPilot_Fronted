import { Tag } from 'antd';

import type { AgentIntent } from '../../types/agent';

const INTENT_META: Record<
  string,
  {
    color: string;
    label: string;
  }
> = {
  faq: {
    color: 'green',
    label: 'FAQ',
  },
  policy: {
    color: 'blue',
    label: 'Policy',
  },
  order: {
    color: 'gold',
    label: 'Order',
  },
  ticket: {
    color: 'purple',
    label: 'Ticket',
  },
  escalation: {
    color: 'red',
    label: 'Escalation',
  },
};

export function AgentIntentTag({ intent }: { intent?: AgentIntent }) {
  const meta = intent
    ? INTENT_META[intent] ?? {
        color: 'default',
        label: intent,
      }
    : {
        color: 'default',
        label: '未返回',
      };

  return (
    <Tag color={meta.color} bordered={false}>
      {meta.label}
    </Tag>
  );
}
