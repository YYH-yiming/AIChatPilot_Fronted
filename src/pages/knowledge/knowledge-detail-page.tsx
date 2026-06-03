import {
  ExperimentOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Table,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getKnowledgeBaseById,
  getKnowledgeDocument,
  getKnowledgeDocumentChunks,
  getKnowledgeDocuments,
  uploadKnowledgeDocument,
} from '../../api/knowledge';
import { ContentState } from '../../components/common/content-state';
import { DocumentParseStatusTag } from '../../components/common/document-parse-status-tag';
import { KnowledgeStatusTag } from '../../components/common/knowledge-status-tag';
import { PageHeader } from '../../components/common/page-header';
import { DocumentChunkDrawer } from '../../components/business/document-chunk-drawer';
import type { KnowledgeBase, KnowledgeChunk, KnowledgeDocument } from '../../types/knowledge';

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

function formatFileSize(value?: number) {
  if (!value || value <= 0) {
    return '未记录';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function mergeDocuments(
  baseList: KnowledgeDocument[],
  overrides: Record<number, KnowledgeDocument>,
) {
  const listMap = new Map<number, KnowledgeDocument>();

  baseList.forEach((item) => {
    listMap.set(item.docId, item);
  });

  Object.values(overrides).forEach((item) => {
    listMap.set(item.docId, item);
  });

  return Array.from(listMap.values()).sort((left, right) => {
    return (right.createdAt || '').localeCompare(left.createdAt || '');
  });
}

export function KnowledgeDetailPage() {
  const { kbId } = useParams();
  const parsedKbId = Number(kbId);
  const validKbId = Number.isFinite(parsedKbId) ? parsedKbId : null;
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollTimersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const [documentOverrides, setDocumentOverrides] = useState<Record<number, KnowledgeDocument>>({});
  const [activeDocument, setActiveDocument] = useState<KnowledgeDocument | null>(null);
  const [chunkDrawerOpen, setChunkDrawerOpen] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(pollTimersRef.current).forEach((timer) => clearInterval(timer));
      pollTimersRef.current = {};
    };
  }, []);

  const detailQuery = useQuery({
    queryKey: ['knowledge-base', validKbId],
    queryFn: () => getKnowledgeBaseById(validKbId as number),
    enabled: validKbId !== null,
  });

  const documentsQuery = useQuery({
    queryKey: ['knowledge-documents', validKbId],
    queryFn: () => getKnowledgeDocuments(validKbId as number),
    enabled: validKbId !== null,
  });

  const chunkQuery = useQuery({
    queryKey: ['knowledge-document-chunks', validKbId, activeDocument?.docId],
    queryFn: () =>
      getKnowledgeDocumentChunks(validKbId as number, activeDocument?.docId as number),
    enabled: validKbId !== null && chunkDrawerOpen && !!activeDocument,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadKnowledgeDocument(validKbId as number, file),
    onSuccess: async (document) => {
      message.success(`文件已上传：${document.fileName}`);
      setDocumentOverrides((current) => ({
        ...current,
        [document.docId]: document,
      }));
      await queryClient.invalidateQueries({ queryKey: ['knowledge-documents', validKbId] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-base', validKbId] });
      startPolling(document.docId);
    },
    onError: (error: Error) => {
      message.error(error.message || '上传失败，请稍后重试');
    },
  });

  const startPolling = (docId: number) => {
    if (pollTimersRef.current[docId] || validKbId === null) {
      return;
    }

    const run = async () => {
      try {
        const document = await getKnowledgeDocument(validKbId, docId);
        setDocumentOverrides((current) => ({
          ...current,
          [docId]: document,
        }));

        if (document.parseStatus === 2 || document.parseStatus === 3) {
          clearInterval(pollTimersRef.current[docId]);
          delete pollTimersRef.current[docId];
          await queryClient.invalidateQueries({ queryKey: ['knowledge-documents', validKbId] });
          await queryClient.invalidateQueries({ queryKey: ['knowledge-base', validKbId] });
        }
      } catch {
        clearInterval(pollTimersRef.current[docId]);
        delete pollTimersRef.current[docId];
      }
    };

    void run();
    pollTimersRef.current[docId] = setInterval(() => {
      void run();
    }, 2500);
  };

  const mergedDocuments = useMemo(() => {
    return mergeDocuments(documentsQuery.data ?? [], documentOverrides);
  }, [documentOverrides, documentsQuery.data]);

  const processingCount = mergedDocuments.filter(
    (item) => item.parseStatus === 0 || item.parseStatus === 1,
  ).length;

  useEffect(() => {
    mergedDocuments.forEach((item) => {
      if ((item.parseStatus === 0 || item.parseStatus === 1) && !pollTimersRef.current[item.docId]) {
        startPolling(item.docId);
      }
    });
  }, [mergedDocuments]);

  const openChunkDrawer = (document: KnowledgeDocument) => {
    setActiveDocument(document);
    setChunkDrawerOpen(true);
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
        title="正在加载知识库详情"
        description="系统正在同步知识库头部信息与文档数据。"
      />
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ContentState
        error
        title="知识库详情加载失败"
        description="请检查知识库服务、鉴权状态或当前知识库是否存在。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => detailQuery.refetch()}>
            重新加载
          </Button>
        }
      />
    );
  }

  const detail = detailQuery.data as KnowledgeBase;

  const documentColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 260,
      render: (_: unknown, record: KnowledgeDocument) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.fileName}</Typography.Text>
          <Typography.Text type="secondary">
            文档 ID {record.docId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '类型 / 大小',
      key: 'fileMeta',
      width: 160,
      render: (_: unknown, record: KnowledgeDocument) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{record.fileType || '未知类型'}</Typography.Text>
          <Typography.Text type="secondary">
            {formatFileSize(record.fileSize)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'parseStatus',
      key: 'parseStatus',
      width: 110,
      render: (value: number) => (
        <DocumentParseStatusTag status={value as 0 | 1 | 2 | 3} />
      ),
    },
    {
      title: '状态信息',
      dataIndex: 'message',
      key: 'message',
      width: 180,
      render: (value?: string) => value || '无状态文案',
    },
    {
      title: '错误信息',
      dataIndex: 'errorMsg',
      key: 'errorMsg',
      width: 220,
      render: (value: string | undefined, record: KnowledgeDocument) =>
        record.parseStatus === 3 ? value || '处理失败，但未返回错误信息' : '无',
    },
    {
      title: 'Chunk 数',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      width: 100,
      render: (value: number) => value ?? 0,
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
      width: 160,
      render: (_: unknown, record: KnowledgeDocument) => (
        <Button
          size="small"
          icon={<FileSearchOutlined />}
          onClick={() => openChunkDrawer(record)}
        >
          查看 Chunk
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Knowledge Detail"
        title={detail.name}
        description={detail.description || '当前知识库暂无描述，适合补充用途、来源范围和适用业务线。'}
        extra={
          <Space size={12} wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void detailQuery.refetch();
                void documentsQuery.refetch();
              }}
              loading={detailQuery.isFetching || documentsQuery.isFetching}
            >
              刷新
            </Button>
            <Button
              icon={<ExperimentOutlined />}
              onClick={() => navigate(`/app/knowledge/${detail.id}/debug`)}
            >
              进入检索调试
            </Button>
          </Space>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="surface-card" bordered={false}>
            <Typography.Title level={4}>知识库概览</Typography.Title>
            <Descriptions column={2} size="middle" labelStyle={{ width: 108 }}>
              <Descriptions.Item label="知识库 ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <KnowledgeStatusTag status={detail.status} />
              </Descriptions.Item>
              <Descriptions.Item label="文档数">{detail.docCount}</Descriptions.Item>
              <Descriptions.Item label="Chunk 数">{detail.chunkCount}</Descriptions.Item>
              <Descriptions.Item label="Embedding 模型">
                {detail.embeddingModel || '未指定'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(detail.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="surface-card surface-card--muted" bordered={false}>
            <Typography.Title level={4}>当前文档处理状态</Typography.Title>
            <Space direction="vertical" size={10}>
              <Typography.Text type="secondary">
                当前有 {processingCount} 份文档处于排队或处理中，系统会每 2.5 秒轮询一次状态，直到完成或失败。
              </Typography.Text>
              <DocumentParseStatusTag status={processingCount > 0 ? 1 : 2} />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card className="surface-card knowledge-upload-card" bordered={false}>
        <div className="knowledge-table-card__header">
          <div>
            <Typography.Title level={4}>单文件上传</Typography.Title>
            <Typography.Paragraph>
              上传成功仅表示文档已入队，系统会继续轮询单文档状态，直到 parseStatus 变为 2（已完成）或 3（失败）为止。
            </Typography.Paragraph>
          </div>
          <Space size={12}>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                uploadMutation.mutate(file);
                event.target.value = '';
              }}
            />
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件上传
            </Button>
          </Space>
        </div>

        <Alert
          type="info"
          showIcon
          message="上传说明"
          description="当前只提供单文件上传，不提供文档删除、单文档重试解析或假进度条。若接口返回 429，通常表示相同文档已在处理中。"
        />
        {uploadMutation.isError ? (
          <Alert
            className="knowledge-upload-card__error"
            type="error"
            showIcon
            message="上传失败"
            description={uploadMutation.error?.message || '请稍后重试'}
          />
        ) : null}
      </Card>

      <Card className="surface-card knowledge-table-card" bordered={false}>
        <div className="knowledge-table-card__header">
          <div>
            <Typography.Title level={4}>文档列表</Typography.Title>
            <Typography.Paragraph>
              这里用于观察单文档解析状态、错误信息和 chunk 结果，偏向调试与工作台阅读。
            </Typography.Paragraph>
          </div>
          <Typography.Text type="secondary" className="knowledge-documents-hint">
            当前文档总数：{mergedDocuments.length}
          </Typography.Text>
        </div>

        {documentsQuery.isLoading ? (
          <ContentState
            loading
            title="正在加载文档列表"
            description="系统正在读取当前知识库下的文档清单。"
          />
        ) : null}

        {!documentsQuery.isLoading && documentsQuery.isError ? (
          <ContentState
            error
            title="文档列表加载失败"
            description="请稍后重试，或检查知识库文档接口是否可用。"
            action={
              <Button icon={<ReloadOutlined />} onClick={() => documentsQuery.refetch()}>
                重新加载
              </Button>
            }
          />
        ) : null}

        {!documentsQuery.isLoading && !documentsQuery.isError && mergedDocuments.length === 0 ? (
          <div className="knowledge-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前知识库还没有文档"
            />
          </div>
        ) : null}

        {!documentsQuery.isLoading && !documentsQuery.isError && mergedDocuments.length > 0 ? (
          <Table
            rowKey="docId"
            columns={documentColumns}
            dataSource={mergedDocuments}
            loading={documentsQuery.isFetching}
            pagination={false}
            scroll={{ x: 1420 }}
          />
        ) : null}
      </Card>

      <DocumentChunkDrawer
        open={chunkDrawerOpen}
        document={activeDocument}
        chunks={chunkQuery.data as KnowledgeChunk[] | undefined}
        loading={chunkQuery.isLoading || chunkQuery.isFetching}
        error={chunkQuery.isError}
        onRetry={() => chunkQuery.refetch()}
        onClose={() => {
          setChunkDrawerOpen(false);
          setActiveDocument(null);
        }}
      />
    </Space>
  );
}
