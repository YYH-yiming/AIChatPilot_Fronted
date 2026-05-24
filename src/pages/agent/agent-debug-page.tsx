import {
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';

import { chatWithAgent } from '../../api/agent';
import { getKnowledgeBases } from '../../api/knowledge';
import { KnowledgeReferenceList } from '../../components/business/knowledge-reference-list';
import { AgentIntentTag } from '../../components/common/agent-intent-tag';
import { ContentState } from '../../components/common/content-state';
import { PageHeader } from '../../components/common/page-header';
import type { AgentChatPayload, AgentChatResponse } from '../../types/agent';
import type { KnowledgeBase } from '../../types/knowledge';

const PRESET_QUESTIONS = [
  {
    key: 'faq',
    label: 'FAQ',
    query: '退款流程是什么？需要准备哪些材料？',
  },
  {
    key: 'policy',
    label: 'Policy',
    query: '员工差旅报销政策里，酒店标准如何规定？',
  },
  {
    key: 'order',
    label: 'Order',
    query: '订单 20240501 的物流状态现在是什么？',
  },
  {
    key: 'ticket',
    label: 'Ticket',
    query: '售后工单 T-10023 目前处理到哪个阶段了？',
  },
  {
    key: 'escalation',
    label: 'Escalation',
    query: '这个问题我需要转人工处理吗？请说明原因。',
  },
];

function formatConfidence(value?: number) {
  if (value === undefined || value === null) {
    return '未返回';
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatDuration(value?: number) {
  if (value === undefined || value === null) {
    return '未返回';
  }

  return `${value} ms`;
}

function formatToken(value?: number) {
  if (value === undefined || value === null) {
    return '未返回';
  }

  return `${value}`;
}

export function AgentDebugPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AgentChatResponse | null>(null);

  const knowledgeQuery = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: getKnowledgeBases,
  });

  const agentMutation = useMutation({
    mutationFn: (payload: AgentChatPayload) => chatWithAgent(payload),
    onSuccess: (response) => {
      setResult(response);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Agent 请求失败');
      setResult(null);
    },
  });

  const onFinish = (values: {
    query: string;
    kbId?: number;
    sessionId?: number;
  }) => {
    const payload: AgentChatPayload = {
      query: values.query.trim(),
    };

    if (values.kbId) {
      payload.kbId = values.kbId;
    }

    if (values.sessionId) {
      payload.sessionId = values.sessionId;
    }

    setSubmitted(true);
    agentMutation.mutate(payload);
  };

  const fillPreset = (query: string) => {
    form.setFieldsValue({ query });
  };

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Agent Debug"
        title="独立 Agent 调试台"
        description="当前页面用于做意图路由、知识库绑定和工具调用的运营验证，不承载 Chat 会话历史或 SSE。"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => knowledgeQuery.refetch()}
            loading={knowledgeQuery.isFetching}
          >
            刷新知识库列表
          </Button>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={8}>
          <Card className="surface-card agent-debug-card" bordered={false}>
            <div className="knowledge-table-card__header">
              <div>
                <Typography.Title level={4}>调试输入</Typography.Title>
                <Typography.Paragraph>
                  可选绑定 `kbId` 和 `sessionId`，用于验证 FAQ / Policy 场景或短期记忆链路。
                </Typography.Paragraph>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="问题输入"
                name="query"
                rules={[
                  { required: true, message: '请输入问题' },
                  { min: 2, message: '问题至少 2 个字符' },
                ]}
              >
                <Input.TextArea
                  rows={6}
                  placeholder="例如：退款流程是什么？订单状态如何查询？是否需要转人工？"
                />
              </Form.Item>

              <Form.Item label="知识库（可选）" name="kbId">
                <Select
                  allowClear
                  placeholder="选择知识库用于 FAQ / Policy 验证"
                  loading={knowledgeQuery.isLoading}
                  options={(knowledgeQuery.data as KnowledgeBase[] | undefined)?.map(
                    (item) => ({
                      label: item.name,
                      value: item.id,
                    }),
                  )}
                />
              </Form.Item>

              <Form.Item label="Session ID（可选）" name="sessionId">
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="输入已有会话 ID 做短期记忆验证"
                />
              </Form.Item>

              <Button
                block
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={agentMutation.isPending}
              >
                执行 Agent 调试
              </Button>
            </Form>
          </Card>

          <Card className="surface-card surface-card--muted agent-preset-card" bordered={false}>
            <Typography.Title level={5}>预置问题</Typography.Title>
            <Space wrap size={[10, 10]}>
              {PRESET_QUESTIONS.map((item) => (
                <Button
                  key={item.key}
                  size="small"
                  onClick={() => fillPreset(item.query)}
                >
                  {item.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          {!submitted ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                title="开始 Agent 验证"
                description="先输入问题，必要时选择知识库或 sessionId，再观察右侧答案、意图、工具调用和引用。"
                action={<Tag color="cyan">适合 FAQ / Policy / Order / Ticket / Escalation 验证</Tag>}
              />
            </Card>
          ) : null}

          {submitted && agentMutation.isPending ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                loading
                title="Agent 调试请求处理中"
                description="系统正在等待路由结果、工具调用和引用信息返回。"
              />
            </Card>
          ) : null}

          {submitted && agentMutation.isError ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                error
                title="Agent 请求失败"
                description="请检查网关、Agent 服务或当前请求参数。"
              />
            </Card>
          ) : null}

          {submitted && !agentMutation.isError && result ? (
            <Space direction="vertical" size={18} className="debug-result-stack">
              <Card className="surface-card surface-card--muted" bordered={false}>
                <div className="knowledge-table-card__header">
                  <div>
                    <Typography.Title level={4}>答案区</Typography.Title>
                    <Typography.Paragraph>
                      这里展示当前 Agent 的最终回答结果，不做聊天消息样式。
                    </Typography.Paragraph>
                  </div>
                  <Tag color="default">
                    Agent {result.agentName || '未返回'}
                  </Tag>
                </div>
                <Typography.Paragraph className="ask-answer__content">
                  {result.answer || '无回答内容'}
                </Typography.Paragraph>
              </Card>

              <Row gutter={[18, 18]}>
                <Col xs={24} xl={12}>
                  <Card className="surface-card" bordered={false}>
                    <div className="section-heading">
                      <Typography.Title level={4}>路由 / 意图区</Typography.Title>
                      <Typography.Text type="secondary">
                        重点看意图命中、置信度和实际 Agent 路由结果。
                      </Typography.Text>
                    </div>
                    <Space direction="vertical" size={12}>
                      <Space size={8} wrap>
                        <AgentIntentTag intent={result.intent} />
                        <Tag color="default">
                          confidence {formatConfidence(result.confidence)}
                        </Tag>
                      </Space>
                      <Typography.Text>
                        agentName：{result.agentName || '未返回'}
                      </Typography.Text>
                      <Typography.Text>
                        kbId：{result.kbId ?? '未绑定'}
                      </Typography.Text>
                      <Typography.Text>
                        sessionId：{result.sessionId ?? '未返回'}
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xl={12}>
                  <Card className="surface-card" bordered={false}>
                    <div className="section-heading">
                      <Typography.Title level={4}>工具调用区</Typography.Title>
                      <Typography.Text type="secondary">
                        重点看这次调用是否真的触发工具，而不是假 trace。
                      </Typography.Text>
                    </div>
                    {result.toolsCalled?.length ? (
                      <Space wrap size={[8, 8]}>
                        {result.toolsCalled.map((tool) => (
                          <Tag key={tool} color="cyan">
                            {tool}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <div className="knowledge-empty">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="当前响应没有工具调用"
                        />
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={[18, 18]}>
                <Col xs={24} xl={12}>
                  <Card className="surface-card" bordered={false}>
                    <div className="section-heading">
                      <Typography.Title level={4}>性能字段</Typography.Title>
                      <Typography.Text type="secondary">
                        用于观察 token 消耗和响应耗时。
                      </Typography.Text>
                    </div>
                    <Space direction="vertical" size={10}>
                      <Typography.Text>
                        tokenUsed：{formatToken(result.tokenUsed)}
                      </Typography.Text>
                      <Typography.Text>
                        durationMs：{formatDuration(result.durationMs)}
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xl={12}>
                  <Card className="surface-card" bordered={false}>
                    <div className="section-heading">
                      <Typography.Title level={4}>原始响应 JSON</Typography.Title>
                      <Typography.Text type="secondary">
                        用于快速检查字段齐全性和后端实际返回。
                      </Typography.Text>
                    </div>
                    <pre className="raw-json-block">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </Card>
                </Col>
              </Row>

              <Card className="surface-card" bordered={false}>
                <div className="section-heading">
                  <Typography.Title level={4}>引用区</Typography.Title>
                  <Typography.Text type="secondary">
                    如果当前 Agent 命中了 FAQ / Policy 等知识引用，会在这里展开。
                  </Typography.Text>
                </div>
                <KnowledgeReferenceList references={result.references} />
              </Card>
            </Space>
          ) : null}
        </Col>
      </Row>
    </Space>
  );
}
