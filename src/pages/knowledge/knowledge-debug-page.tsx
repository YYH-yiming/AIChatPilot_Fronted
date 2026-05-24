import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  askKnowledgeBase,
  getKnowledgeBaseById,
  searchKnowledgeBase,
} from '../../api/knowledge';
import { KnowledgeReferenceList } from '../../components/business/knowledge-reference-list';
import { ContentState } from '../../components/common/content-state';
import { KnowledgeStatusTag } from '../../components/common/knowledge-status-tag';
import { PageHeader } from '../../components/common/page-header';
import type {
  KnowledgeAskResponse,
  KnowledgeBase,
  KnowledgeSearchPayload,
  KnowledgeSearchResult,
} from '../../types/knowledge';

type DebugMode = 'search' | 'ask';

function formatScore(value?: number | null) {
  if (value === null || value === undefined) {
    return '无';
  }

  return value.toFixed(4);
}

export function KnowledgeDebugPage() {
  const { kbId } = useParams();
  const parsedKbId = Number(kbId);
  const validKbId = Number.isFinite(parsedKbId) ? parsedKbId : null;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<DebugMode>('search');
  const [submitted, setSubmitted] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[] | null>(null);
  const [askResult, setAskResult] = useState<KnowledgeAskResponse | null>(null);

  const detailQuery = useQuery({
    queryKey: ['knowledge-base', validKbId],
    queryFn: () => getKnowledgeBaseById(validKbId as number),
    enabled: validKbId !== null,
  });

  const searchMutation = useMutation({
    mutationFn: (payload: KnowledgeSearchPayload) =>
      searchKnowledgeBase(validKbId as number, payload),
    onSuccess: (result) => {
      setSearchResults(result);
      setAskResult(null);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Search 请求失败');
    },
  });

  const askMutation = useMutation({
    mutationFn: (payload: KnowledgeSearchPayload) =>
      askKnowledgeBase(validKbId as number, payload),
    onSuccess: (result) => {
      setAskResult(result);
      setSearchResults(null);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Ask 请求失败');
    },
  });

  const searchColumns = useMemo(
    () => [
      {
        title: 'Chunk / Doc',
        key: 'chunkMeta',
        width: 180,
        render: (_: unknown, record: KnowledgeSearchResult) => (
          <Space direction="vertical" size={2}>
            <Typography.Text strong>Chunk {record.chunkId}</Typography.Text>
            <Typography.Text type="secondary">
              Doc {record.docId} · Index {record.chunkIndex}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: 'Source',
        dataIndex: 'source',
        key: 'source',
        width: 110,
        render: (value?: string) => <Tag color="cyan">{value || '未知'}</Tag>,
      },
      {
        title: 'Score',
        key: 'scores',
        width: 240,
        render: (_: unknown, record: KnowledgeSearchResult) => (
          <Space direction="vertical" size={2}>
            <Typography.Text>融合分：{formatScore(record.score)}</Typography.Text>
            <Typography.Text type="secondary">
              Dense：{formatScore(record.denseScore)}
            </Typography.Text>
            <Typography.Text type="secondary">
              Sparse：{formatScore(record.sparseScore)}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        render: (value: string) => (
          <Typography.Paragraph className="search-result__content">
            {value || '无命中内容'}
          </Typography.Paragraph>
        ),
      },
    ],
    [],
  );

  const onFinish = (values: { query: string; topK?: number }) => {
    const payload = {
      query: values.query.trim(),
      topK: values.topK || 5,
    };

    setSubmitted(true);

    if (mode === 'search') {
      searchMutation.mutate(payload);
      return;
    }

    askMutation.mutate(payload);
  };

  if (validKbId === null) {
    return (
      <ContentState
        error
        title="知识库标识无效"
        description="当前路由参数不是有效的知识库 ID。"
      />
    );
  }

  if (detailQuery.isLoading) {
    return (
      <ContentState
        loading
        title="正在加载调试上下文"
        description="系统正在同步当前知识库的调试信息。"
      />
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ContentState
        error
        title="调试页上下文加载失败"
        description="请检查知识库是否存在，或稍后重试。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => detailQuery.refetch()}>
            重新加载
          </Button>
        }
      />
    );
  }

  const detail = detailQuery.data as KnowledgeBase;
  const activeLoading =
    mode === 'search' ? searchMutation.isPending : askMutation.isPending;
  const activeError =
    mode === 'search' ? searchMutation.isError : askMutation.isError;

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Knowledge Debug"
        title={`检索调试 · ${detail.name}`}
        description="当前页面用于对比 Search 与 Ask 的行为差异，重点暴露 source、dense、sparse、grounded 和 references。"
        extra={
          <Space size={12} wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/app/knowledge/${detail.id}`)}
            >
              返回知识库详情
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => detailQuery.refetch()}
              loading={detailQuery.isFetching}
            >
              刷新上下文
            </Button>
          </Space>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={8}>
          <Card className="surface-card surface-card--muted" bordered={false}>
            <Typography.Title level={4}>当前知识库上下文</Typography.Title>
            <Space direction="vertical" size={10}>
              <Typography.Text>知识库 ID：{detail.id}</Typography.Text>
              <Typography.Text>文档数：{detail.docCount}</Typography.Text>
              <Typography.Text>Chunk 数：{detail.chunkCount}</Typography.Text>
              <Typography.Text>
                Embedding：{detail.embeddingModel || '未指定'}
              </Typography.Text>
              <Space size={8} wrap>
                <KnowledgeStatusTag status={detail.status} />
                <Tag color="default">Tenant {detail.tenantId}</Tag>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card className="surface-card knowledge-debug-controls" bordered={false}>
            <div className="knowledge-table-card__header">
              <div>
                <Typography.Title level={4}>调试输入</Typography.Title>
                <Typography.Paragraph>
                  Search 用于看命中了哪些 chunk，Ask 用于看最终回答是否真正基于知识库引用。
                </Typography.Paragraph>
              </div>
              <Radio.Group
                value={mode}
                onChange={(event: { target: { value: string } }) =>
                  setMode(event.target.value as DebugMode)
                }
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="search">Search</Radio.Button>
                <Radio.Button value="ask">Ask</Radio.Button>
              </Radio.Group>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={{ topK: 5 }}
              onFinish={onFinish}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} lg={16}>
                  <Form.Item
                    label={mode === 'search' ? 'Search Query' : 'Ask Query'}
                    name="query"
                    rules={[
                      { required: true, message: '请输入 query' },
                      { min: 2, message: 'query 至少 2 个字符' },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder={
                        mode === 'search'
                          ? '例如：退款流程、发票申请、售后质保'
                          : '例如：公司退款流程是什么？需要哪些材料？'
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={8}>
                  <Form.Item
                    label="TopK"
                    name="topK"
                    rules={[
                      { required: true, message: '请输入 topK' },
                    ]}
                  >
                    <InputNumber min={1} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    icon={mode === 'search' ? <SearchOutlined /> : <QuestionCircleOutlined />}
                    loading={activeLoading}
                  >
                    {mode === 'search' ? '执行 Search' : '执行 Ask'}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card className="surface-card knowledge-debug-results" bordered={false}>
        {!submitted ? (
          <ContentState
            title="开始调试"
            description="先选择 Search 或 Ask，填写 query 与 topK，再观察右侧结果区的命中来源和引用情况。"
            action={
              <Tag color="cyan">默认进入 Search 视图</Tag>
            }
          />
        ) : null}

        {submitted && activeError ? (
          <ContentState
            error
            title={mode === 'search' ? 'Search 请求失败' : 'Ask 请求失败'}
            description="请检查当前知识库、网关状态或稍后重试。"
          />
        ) : null}

        {submitted && !activeError && mode === 'search' && searchMutation.isSuccess ? (
          <Space direction="vertical" size={18} className="debug-result-stack">
            <div className="knowledge-table-card__header">
              <div>
                <Typography.Title level={4}>Search 结果区</Typography.Title>
                <Typography.Paragraph>
                  这里直接展示 chunk 命中明细，强调 source、dense、sparse 和最终融合分。
                </Typography.Paragraph>
              </div>
              <Tag color="default">命中 {searchResults?.length || 0} 条</Tag>
            </div>

            {!searchResults?.length ? (
              <div className="knowledge-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前 query 没有命中任何检索结果"
                />
              </div>
            ) : (
              <Table
                rowKey={(record: KnowledgeSearchResult) =>
                  `${record.docId}-${record.chunkId}-${record.chunkIndex}`
                }
                columns={searchColumns}
                dataSource={searchResults}
                pagination={false}
                scroll={{ x: 1080 }}
              />
            )}
          </Space>
        ) : null}

        {submitted && !activeError && mode === 'ask' && askMutation.isSuccess && askResult ? (
          <Space direction="vertical" size={18} className="debug-result-stack">
            <div className="knowledge-table-card__header">
              <div>
                <Typography.Title level={4}>Ask 结果区</Typography.Title>
                <Typography.Paragraph>
                  这里展示最终回答、grounded 标识、使用模型和引用区，不隐藏关键诊断字段。
                </Typography.Paragraph>
              </div>
              <Space size={8} wrap>
                <Tag color={askResult.grounded ? 'green' : 'gold'}>
                  grounded={String(askResult.grounded)}
                </Tag>
                <Tag color="default">
                  引用 {askResult.referenceCount}
                </Tag>
              </Space>
            </div>

            {!askResult.grounded ? (
              <Alert
                type="warning"
                showIcon
                message="当前回答未命中知识库资料"
                description="grounded=false，说明这次回答没有稳定建立在当前知识库引用之上。"
              />
            ) : null}

            <Card className="surface-card surface-card--muted" bordered={false}>
              <Space direction="vertical" size={10} className="ask-answer">
                <Space size={8} wrap>
                  <Tag color="default">Model {askResult.model || '未返回'}</Tag>
                  <Tag color="default">TopK {askResult.topK}</Tag>
                </Space>
                <Typography.Title level={5}>最终回答</Typography.Title>
                <Typography.Paragraph className="ask-answer__content">
                  {askResult.answer || '无回答内容'}
                </Typography.Paragraph>
              </Space>
            </Card>

            <section>
              <div className="section-heading">
                <Typography.Title level={4}>引用区</Typography.Title>
                <Typography.Text type="secondary">
                  当前回答引用了哪些 chunk，会在这里完整展示。
                </Typography.Text>
              </div>
              <KnowledgeReferenceList
                references={askResult.references}
              />
            </section>
          </Space>
        ) : null}
      </Card>
    </Space>
  );
}
