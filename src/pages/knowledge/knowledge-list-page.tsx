import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ExperimentOutlined,
  FolderAddOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBases,
  updateKnowledgeBase,
} from '../../api/knowledge';
import { KnowledgeStatusTag } from '../../components/common/knowledge-status-tag';
import { PageHeader } from '../../components/common/page-header';
import { KnowledgeBaseFormModal } from '../../components/business/knowledge-base-form-modal';
import { ContentState } from '../../components/common/content-state';
import type { KnowledgeBase, KnowledgeBasePayload } from '../../types/knowledge';

const KNOWLEDGE_QUERY_KEY = ['knowledge-bases'];

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

export function KnowledgeListPage() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<KnowledgeBase | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const knowledgeQuery = useQuery({
    queryKey: KNOWLEDGE_QUERY_KEY,
    queryFn: getKnowledgeBases,
  });

  const createMutation = useMutation({
    mutationFn: createKnowledgeBase,
    onSuccess: async () => {
      message.success('知识库已创建');
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_QUERY_KEY });
      setModalOpen(false);
      setEditingRecord(null);
    },
    onError: (error: Error) => {
      message.error(error.message || '创建失败，请稍后重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: KnowledgeBasePayload;
    }) => updateKnowledgeBase(id, payload),
    onSuccess: async () => {
      message.success('知识库已更新');
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_QUERY_KEY });
      setModalOpen(false);
      setEditingRecord(null);
    },
    onError: (error: Error) => {
      message.error(error.message || '更新失败，请稍后重试');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      message.success('知识库已删除');
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_QUERY_KEY });
    },
    onError: (error: Error) => {
      message.error(error.message || '删除失败，请稍后重试');
    },
  });

  const list = knowledgeQuery.data ?? [];
  const metrics = useMemo(() => {
    return list.reduce(
      (acc, item) => {
        acc.baseCount += 1;
        acc.docCount += item.docCount ?? 0;
        acc.chunkCount += item.chunkCount ?? 0;
        return acc;
      },
      {
        baseCount: 0,
        docCount: 0,
        chunkCount: 0,
      },
    );
  }, [list]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: KnowledgeBase) => {
    setModalMode('edit');
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleSubmit = async (values: KnowledgeBasePayload) => {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(values);
      return;
    }

    if (!editingRecord) {
      return;
    }

    await updateMutation.mutateAsync({
      id: editingRecord.id,
      payload: values,
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (_: unknown, record: KnowledgeBase) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">
            ID {record.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => value || '未填写',
    },
    {
      title: '文档数',
      dataIndex: 'docCount',
      key: 'docCount',
      width: 96,
      render: (value: number) => value ?? 0,
    },
    {
      title: 'Chunk 数',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      width: 108,
      render: (value: number) => value ?? 0,
    },
    {
      title: 'Embedding 模型',
      dataIndex: 'embeddingModel',
      key: 'embeddingModel',
      width: 220,
      render: (value?: string) => value || '未指定',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 108,
      render: (value: number) => <KnowledgeStatusTag status={value} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 260,
      render: (_: unknown, record: KnowledgeBase) => (
        <Space size={8} wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/app/knowledge/${record.id}`)}
          >
            查看详情
          </Button>
          <Button
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => navigate(`/app/knowledge/${record.id}/debug`)}
          >
            检索调试
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            loading={
              updateMutation.isPending && editingRecord?.id === record.id
            }
          >
            编辑
          </Button>
          <Popconfirm
            title="删除知识库"
            description="删除后将无法恢复。确认继续吗？"
            okText="确认删除"
            cancelText="取消"
            onConfirm={() => deleteMutation.mutateAsync(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (knowledgeQuery.isLoading) {
    return (
      <ContentState
        loading
        title="正在加载知识库列表"
        description="系统正在读取当前租户下的知识库信息。"
      />
    );
  }

  if (knowledgeQuery.isError) {
    return (
      <ContentState
        error
        title="知识库列表加载失败"
        description="请检查网关、鉴权状态或知识库服务是否可用。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => knowledgeQuery.refetch()}>
            重新加载
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Knowledge"
        title="知识库管理"
        description="当前页面负责承接当前租户下的知识库列表与基础 CRUD。详情、文档上传和检索调试将在后续子任务接入。"
        extra={
          <Button
            type="primary"
            size="large"
            icon={<FolderAddOutlined />}
            onClick={handleOpenCreate}
          >
            新建知识库
          </Button>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} md={8}>
          <Card className="surface-card knowledge-metric-card" bordered={false}>
            <Typography.Text type="secondary">知识库总数</Typography.Text>
            <Typography.Title level={3}>{metrics.baseCount}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="surface-card knowledge-metric-card" bordered={false}>
            <Typography.Text type="secondary">文档总数</Typography.Text>
            <Typography.Title level={3}>{metrics.docCount}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="surface-card knowledge-metric-card" bordered={false}>
            <Typography.Text type="secondary">Chunk 总数</Typography.Text>
            <Typography.Title level={3}>{metrics.chunkCount}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card className="surface-card knowledge-table-card" bordered={false}>
        <div className="knowledge-table-card__header">
          <div>
            <Typography.Title level={4}>当前租户知识库</Typography.Title>
            <Typography.Paragraph>
              表格视图优先支持管理与排查。每条记录可直接进入详情占位或调试占位，并支持编辑、删除。
            </Typography.Paragraph>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => knowledgeQuery.refetch()}
            loading={knowledgeQuery.isFetching}
          >
            刷新列表
          </Button>
        </div>

        {list.length === 0 ? (
          <div className="knowledge-empty">
            <Empty
              description="当前租户下还没有知识库"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<FolderAddOutlined />}
                onClick={handleOpenCreate}
              >
                创建第一个知识库
              </Button>
            </Empty>
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={knowledgeQuery.isFetching}
            pagination={false}
            scroll={{ x: 1320 }}
          />
        )}
      </Card>

      <KnowledgeBaseFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord}
        confirmLoading={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onCancel={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleSubmit}
      />
    </Space>
  );
}
