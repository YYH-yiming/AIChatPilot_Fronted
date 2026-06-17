import {
  AudioOutlined,
  LoadingOutlined,
  LockOutlined,
  MessageOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Pagination,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  closeChatSession,
  createChatSession,
  getChatMessages,
  getChatSessionDetail,
  getChatSessions,
  sendChatMessage,
  streamChatAudioMessage,
  streamChatImageMessage,
  streamChatMessage,
} from '../../api/chat';
import type { StreamChatHandlers } from '../../api/chat';
import { getKnowledgeBases } from '../../api/knowledge';
import { ChatCreateSessionModal } from '../../components/business/chat-create-session-modal';
import { KnowledgeReferenceList } from '../../components/business/knowledge-reference-list';
import { AgentIntentTag } from '../../components/common/agent-intent-tag';
import { ContentState } from '../../components/common/content-state';
import { PageHeader } from '../../components/common/page-header';
import type { PageResult } from '../../types/api';
import type {
  ChatMessage,
  ChatReply,
  ChatSession,
  ChatSessionDetail,
  ChatStreamDoneEvent,
  ChatStreamMetaEvent,
  CreateChatSessionPayload,
  SendChatMessagePayload,
} from '../../types/chat';
import type { KnowledgeBase } from '../../types/knowledge';

const SESSION_PAGE_SIZE = 12;
const MESSAGE_PAGE_SIZE = 20;

type StreamPhase = 'sending' | 'start' | 'meta' | 'streaming' | 'reply';

type ActiveStreamState = {
  sessionId: number;
  userContent: string;
  phase: StreamPhase;
  reply?: ChatReply; // 假流式 / agent 整段回答
  meta?: ChatStreamMetaEvent; // 真流式：检索元信息（引用 / grounded / 改写）
  streamingAnswer?: string; // 真流式：已累积的可见答案
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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 后端 ChatConstants：SESSION_STATUS_ACTIVE = 1、SESSION_STATUS_CLOSED = 2
const SESSION_STATUS_CLOSED = 2;

function isClosedSession(session?: ChatSession | null) {
  return session?.status === SESSION_STATUS_CLOSED;
}

function mergeMessages(
  baseList: ChatMessage[],
  overrides: Record<number, ChatMessage>,
) {
  const map = new Map<number, ChatMessage>();
  baseList.forEach((item) => map.set(item.messageId, item));
  Object.values(overrides).forEach((item) => map.set(item.messageId, item));

  return Array.from(map.values()).sort((left, right) => {
    return (left.createdAt || '').localeCompare(right.createdAt || '');
  });
}

// 真流式无整段 reply：用 meta（检索元信息）+ 累积文本 + done（消息 id / 耗时）拼出 ChatReply，
// 复用 buildReplyMessages / finalizeStreamReply 落库，与假流式同一条收尾路径。
function buildStreamReply(
  answer: string,
  meta: ChatStreamMetaEvent | undefined,
  doneEvent: ChatStreamDoneEvent,
  fallbackSessionId: number,
): ChatReply {
  return {
    sessionId: doneEvent.sessionId ?? fallbackSessionId,
    userMessageId: doneEvent.userMessageId ?? -1,
    assistantMessageId: doneEvent.assistantMessageId ?? -2,
    mode: meta?.mode ?? 'knowledge',
    answerSource: meta?.answerSource,
    answer,
    rewrittenQuery: meta?.rewrittenQuery,
    kbId: meta?.kbId,
    topK: meta?.topK,
    grounded: meta?.grounded,
    referenceCount: meta?.referenceCount,
    references: meta?.references,
    durationMs: doneEvent.durationMs,
  };
}

function buildReplyMessages(reply: ChatReply, userContent: string) {
  const now = new Date().toISOString();

  return {
    [reply.userMessageId]: {
      messageId: reply.userMessageId,
      sessionId: reply.sessionId,
      role: 'user' as const,
      content: userContent,
      createdAt: now,
    },
    [reply.assistantMessageId]: {
      messageId: reply.assistantMessageId,
      sessionId: reply.sessionId,
      role: 'assistant' as const,
      content: reply.answer,
      answerSource: reply.answerSource,
      intent: reply.intent,
      kbId: reply.kbId,
      tokenUsed: reply.tokenUsed,
      durationMs: reply.durationMs,
      createdAt: now,
      references: reply.references,
      rewrittenQuery: reply.rewrittenQuery,
      grounded: reply.grounded,
      referenceCount: reply.referenceCount,
      toolsCalled: reply.toolsCalled,
    },
  };
}

export function ChatWorkspacePage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const parsedSessionId = sessionId ? Number(sessionId) : null;
  const validSessionId =
    parsedSessionId !== null && Number.isFinite(parsedSessionId)
      ? parsedSessionId
      : null;
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [sessionPageNum, setSessionPageNum] = useState(1);
  const [messagePageNum, setMessagePageNum] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [messageForm] = Form.useForm();
  const [messageOverrides, setMessageOverrides] = useState<Record<number, ChatMessage>>({});
  const [closedSessionIds, setClosedSessionIds] = useState<Record<number, true>>({});
  const [activeStream, setActiveStream] = useState<ActiveStreamState | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamSending, setStreamSending] = useState(false);
  const [streamReplyReceived, setStreamReplyReceived] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const resetStreamState = () => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setActiveStream(null);
    setStreamError(null);
    setStreamSending(false);
    setStreamReplyReceived(false);
  };

  useEffect(() => {
    setMessagePageNum(1);
    messageForm.resetFields();
    resetStreamState();
  }, [messageForm, validSessionId]);

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions', sessionPageNum, SESSION_PAGE_SIZE],
    queryFn: () => getChatSessions(sessionPageNum, SESSION_PAGE_SIZE),
  });

  const knowledgeQuery = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: getKnowledgeBases,
  });

  const sessionDetailQuery = useQuery({
    queryKey: ['chat-session-detail', validSessionId],
    queryFn: () => getChatSessionDetail(validSessionId as number, MESSAGE_PAGE_SIZE),
    enabled: validSessionId !== null,
  });

  const messagesQuery = useQuery({
    queryKey: ['chat-session-messages', validSessionId, messagePageNum, MESSAGE_PAGE_SIZE],
    queryFn: () =>
      getChatMessages(validSessionId as number, messagePageNum, MESSAGE_PAGE_SIZE),
    enabled: validSessionId !== null,
  });

  const createSessionMutation = useMutation({
    mutationFn: (payload: CreateChatSessionPayload) => createChatSession(payload),
    onSuccess: async (session) => {
      message.success('会话已创建');
      setCreateModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      navigate(`/app/chat/${session.sessionId}`);
    },
    onError: (error: Error) => {
      message.error(error.message || '创建会话失败');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: SendChatMessagePayload) =>
      sendChatMessage(validSessionId as number, payload),
    onSuccess: async (reply: ChatReply) => {
      setMessageOverrides((current) => ({
        ...current,
        ...buildReplyMessages(
          reply,
          messageForm.getFieldValue('content')?.trim() || '',
        ),
      }));
      message.success('消息已发送');
      messageForm.resetFields();
      await queryClient.invalidateQueries({
        queryKey: ['chat-session-detail', validSessionId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['chat-session-messages', validSessionId],
      });
      await queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '消息发送失败');
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: () => closeChatSession(validSessionId as number),
    onSuccess: async () => {
      if (validSessionId !== null) {
        setClosedSessionIds((current) => ({
          ...current,
          [validSessionId]: true,
        }));
      }
      message.success('会话已关闭');
      await queryClient.invalidateQueries({
        queryKey: ['chat-session-detail', validSessionId],
      });
      await queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '关闭会话失败');
    },
  });

  const selectedSessionDetail = sessionDetailQuery.data as ChatSessionDetail | undefined;
  const selectedSession = selectedSessionDetail?.session ?? null;
  const isClosed =
    (validSessionId !== null && !!closedSessionIds[validSessionId]) ||
    isClosedSession(selectedSession);

  const messageRecords = useMemo(() => {
    const base =
      ((messagesQuery.data as PageResult<ChatMessage> | undefined)?.records ??
        selectedSessionDetail?.messages ??
        []) as ChatMessage[];
    return mergeMessages(base, messageOverrides);
  }, [messageOverrides, messagesQuery.data, selectedSessionDetail?.messages]);

  const finalizeStreamReply = async (
    reply: ChatReply,
    userContent: string,
    _doneEvent?: ChatStreamDoneEvent,
  ) => {
    setMessageOverrides((current) => ({
      ...current,
      ...buildReplyMessages(reply, userContent),
    }));
    messageForm.resetFields();
    await queryClient.invalidateQueries({
      queryKey: ['chat-session-detail', validSessionId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['chat-session-messages', validSessionId],
    });
    await queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
  };

  // 文本/语音共用的流式编排：建 AbortController、维护本次流的闭包状态、统一各事件回调与收尾。
  // userContentInitial = 先占位的用户气泡文本（语音用"识别中…"，收到 recognized 事件后替换为转写文本）。
  const startStreaming = async (
    userContentInitial: string,
    invoke: (handlers: StreamChatHandlers, signal: AbortSignal) => Promise<void>,
  ) => {
    if (validSessionId === null || isClosed || streamSending) {
      return;
    }
    const controller = new AbortController();
    const state = {
      reply: undefined as ChatReply | undefined,
      meta: undefined as ChatStreamMetaEvent | undefined,
      text: '',
      done: false,
      userContent: userContentInitial,
    };
    streamAbortRef.current = controller;
    setStreamSending(true);
    setStreamError(null);
    setStreamReplyReceived(false);
    setActiveStream({
      sessionId: validSessionId,
      userContent: userContentInitial,
      phase: 'sending',
    });

    try {
      await invoke(
        {
          onStart: () => {
            setActiveStream((current) =>
              current ? { ...current, phase: 'start' } : current,
            );
          },
          // 语音/图像：识别完成 → 把用户气泡占位文本替换为真实识别文本，并用于落库。
          onRecognized: (event) => {
            state.userContent = event.text;
            setActiveStream((current) =>
              current ? { ...current, userContent: event.text } : current,
            );
          },
          onMeta: (metaEvent) => {
            state.meta = metaEvent;
            setActiveStream((current) =>
              current ? { ...current, phase: 'meta', meta: metaEvent } : current,
            );
          },
          onToken: (tokenEvent) => {
            state.text += tokenEvent.text;
            const snapshot = state.text;
            setStreamReplyReceived(true);
            setActiveStream((current) =>
              current
                ? { ...current, phase: 'streaming', streamingAnswer: snapshot }
                : current,
            );
          },
          onReply: (reply) => {
            state.reply = reply;
            setStreamReplyReceived(true);
            setActiveStream((current) =>
              current ? { ...current, phase: 'reply', reply } : current,
            );
          },
          onDone: async (doneEvent) => {
            state.done = true;
            const finalReply =
              state.reply ??
              (state.text || state.meta
                ? buildStreamReply(state.text, state.meta, doneEvent, validSessionId)
                : undefined);
            if (finalReply) {
              await finalizeStreamReply(finalReply, state.userContent, doneEvent);
              message.success('回答已生成');
            }
            setStreamSending(false);
            streamAbortRef.current = null;
            setActiveStream(null);
          },
          onError: (event) => {
            const text = event.message || '流式消息处理失败';
            setStreamError(text);
            setStreamSending(false);
            streamAbortRef.current = null;
            setActiveStream(null);
            message.error(text);
          },
        },
        controller.signal,
      );
    } catch (error) {
      // 已收到 done（流正常结束）后底层连接善后关闭抛错属误报，吞掉。
      if (controller.signal.aborted || state.done) {
        return;
      }
      const text = error instanceof Error ? error.message : '流式请求启动失败';
      setStreamError(text);
      setStreamSending(false);
      streamAbortRef.current = null;
      setActiveStream(null);
      message.error(text);
    }
  };

  const handleStreamSend = async () => {
    if (validSessionId === null || isClosed || streamSending) {
      return;
    }
    const values = (await messageForm.validateFields()) as { content: string };
    const content = values.content.trim();
    await startStreaming(content, (handlers, signal) =>
      streamChatMessage(validSessionId, { content }, handlers, signal),
    );
  };

  const handleAudioSend = async (audio: Blob) => {
    if (validSessionId === null || isClosed || streamSending) {
      return;
    }
    await startStreaming('🎤 语音识别中…', (handlers, signal) =>
      streamChatAudioMessage(validSessionId, audio, handlers, signal),
    );
  };

  const handleImageSend = async (image: File) => {
    if (validSessionId === null || isClosed || streamSending) {
      return;
    }
    // 输入框文字若有，作为图片的随附问题（caption）一并发送。
    const caption =
      (messageForm.getFieldValue('content') as string | undefined)?.trim() || undefined;
    await startStreaming('🖼️ 图片识别中…', (handlers, signal) =>
      streamChatImageMessage(validSessionId, image, handlers, signal, caption),
    );
  };

  const startRecording = async () => {
    if (isClosed || streamSending || isRecording) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      message.error('当前浏览器不支持录音');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        audioChunksRef.current = [];
        if (blob.size > 0) {
          void handleAudioSend(blob);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      const text = error instanceof Error ? error.message : '无法访问麦克风';
      message.error(`录音失败：${text}`);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const renderSessionItem = (session: ChatSession) => {
    const active = session.sessionId === validSessionId;
    return (
      <button
        key={session.sessionId}
        type="button"
        className={`chat-session-item${active ? ' chat-session-item--active' : ''}`}
        onClick={() => {
          resetStreamState();
          setMessagePageNum(1);
          navigate(`/app/chat/${session.sessionId}`);
        }}
      >
        <span className="chat-session-item__title">{session.title || '未命名会话'}</span>
        <span className="chat-session-item__meta">
          <Tag color={session.mode === 'knowledge' ? 'cyan' : 'purple'}>
            {session.mode}
          </Tag>
          <small>{formatDateTime(session.lastMessageAt || session.updatedAt)}</small>
        </span>
      </button>
    );
  };

  const renderAssistantMetadata = (messageItem: ChatMessage) => (
    <Space direction="vertical" size={10} className="chat-message-meta">
      <Space size={8} wrap>
        <Tag color="default">
          source {messageItem.answerSource || '未返回'}
        </Tag>
        {messageItem.intent ? <AgentIntentTag intent={messageItem.intent} /> : null}
        {messageItem.kbId ? <Tag color="cyan">kbId {messageItem.kbId}</Tag> : null}
        {messageItem.grounded !== undefined ? (
          <Tag color={messageItem.grounded ? 'green' : 'gold'}>
            grounded={String(messageItem.grounded)}
          </Tag>
        ) : null}
        {messageItem.referenceCount !== undefined ? (
          <Tag color="default">references {messageItem.referenceCount}</Tag>
        ) : null}
      </Space>
      <Space size={8} wrap>
        {messageItem.tokenUsed !== undefined ? (
          <Tag color="default">tokenUsed {messageItem.tokenUsed}</Tag>
        ) : null}
        {messageItem.durationMs !== undefined ? (
          <Tag color="default">durationMs {messageItem.durationMs}ms</Tag>
        ) : null}
      </Space>
      {messageItem.rewrittenQuery ? (
        <Alert
          type="info"
          showIcon
          message="rewrittenQuery"
          description={messageItem.rewrittenQuery}
        />
      ) : null}
      {messageItem.toolsCalled?.length ? (
        <Space size={8} wrap>
          {messageItem.toolsCalled.map((tool) => (
            <Tag key={tool} color="purple">
              {tool}
            </Tag>
          ))}
        </Space>
      ) : null}
      {messageItem.references?.length ? (
        <KnowledgeReferenceList references={messageItem.references} />
      ) : null}
    </Space>
  );

  const streamPreviewMessages = useMemo(() => {
    if (!activeStream || activeStream.sessionId !== validSessionId) {
      return [];
    }

    const now = new Date().toISOString();
    const userPreview: ChatMessage = {
      messageId: -1,
      sessionId: activeStream.sessionId,
      role: 'user',
      content: activeStream.userContent,
      createdAt: now,
    };

    // 检索元信息：假流式来自整段 reply，真流式来自 meta；字段一致，统一取用以便边生成边展示引用。
    const info = activeStream.reply ?? activeStream.meta;
    const streamedAnswer =
      activeStream.reply?.answer ?? activeStream.streamingAnswer ?? '';
    const assistantContent = streamedAnswer
      ? streamedAnswer
      : activeStream.meta
        ? '检索完成，正在生成回答…'
        : '正在思考…';

    const assistantPreview: ChatMessage = {
      messageId: -2,
      sessionId: activeStream.sessionId,
      role: 'assistant',
      content: assistantContent,
      answerSource: info?.answerSource,
      intent: activeStream.reply?.intent,
      kbId: info?.kbId,
      tokenUsed: activeStream.reply?.tokenUsed,
      durationMs: activeStream.reply?.durationMs,
      createdAt: now,
      references: info?.references,
      rewrittenQuery: info?.rewrittenQuery,
      grounded: info?.grounded,
      referenceCount: info?.referenceCount,
      toolsCalled: activeStream.reply?.toolsCalled,
    };

    return [userPreview, assistantPreview];
  }, [activeStream, validSessionId]);

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <PageHeader
        eyebrow="Chat Workspace"
        title="会话中心"
        description="管理会话历史，支持知识库与 Agent 两种模式的问答与流式回复。"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建会话
          </Button>
        }
      />

      <Row gutter={[18, 18]} className="chat-workspace">
        <Col xs={24} xl={7}>
          <Card className="surface-card chat-sidebar-card" bordered={false}>
            <div className="knowledge-table-card__header">
              <div>
                <Typography.Title level={4}>会话列表</Typography.Title>
                <Typography.Paragraph>
                  选择会话查看历史，或新建会话开始问答。
                </Typography.Paragraph>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => sessionsQuery.refetch()}
                loading={sessionsQuery.isFetching}
              >
                刷新
              </Button>
            </div>

            {sessionsQuery.isLoading ? (
              <ContentState
                loading
                title="正在加载会话列表"
                description="系统正在读取当前用户最近会话。"
              />
            ) : null}

            {!sessionsQuery.isLoading && sessionsQuery.isError ? (
              <ContentState
                error
                title="会话列表加载失败"
                description="请稍后重试，或检查 Chat 服务是否可用。"
                action={
                  <Button icon={<ReloadOutlined />} onClick={() => sessionsQuery.refetch()}>
                    重新加载
                  </Button>
                }
              />
            ) : null}

            {!sessionsQuery.isLoading &&
            !sessionsQuery.isError &&
            !(sessionsQuery.data as PageResult<ChatSession> | undefined)?.records?.length ? (
              <div className="knowledge-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前还没有会话"
                >
                  <Button type="primary" onClick={() => setCreateModalOpen(true)}>
                    创建第一个会话
                  </Button>
                </Empty>
              </div>
            ) : null}

            {!sessionsQuery.isLoading &&
            !sessionsQuery.isError &&
            (sessionsQuery.data as PageResult<ChatSession> | undefined)?.records?.length ? (
              <Space direction="vertical" size={14} className="chat-session-list">
                {(sessionsQuery.data as PageResult<ChatSession>).records.map(renderSessionItem)}
                <Pagination
                  size="small"
                  current={(sessionsQuery.data as PageResult<ChatSession>).pageNum}
                  pageSize={(sessionsQuery.data as PageResult<ChatSession>).pageSize}
                  total={(sessionsQuery.data as PageResult<ChatSession>).total}
                  onChange={(page: number) => setSessionPageNum(page)}
                />
              </Space>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} xl={17}>
          {validSessionId === null ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                title="选择一个会话"
                description="从左侧选择已有会话，或直接新建会话后进入同步消息工作台。"
                action={
                  <Button type="primary" onClick={() => setCreateModalOpen(true)}>
                    新建会话
                  </Button>
                }
              />
            </Card>
          ) : null}

          {validSessionId !== null && sessionDetailQuery.isLoading ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                loading
                title="正在加载会话详情"
                description="系统正在同步会话头信息和最近消息。"
              />
            </Card>
          ) : null}

          {validSessionId !== null &&
          !sessionDetailQuery.isLoading &&
          (sessionDetailQuery.isError || !selectedSession) ? (
            <Card className="surface-card" bordered={false}>
              <ContentState
                error
                title="会话详情加载失败"
                description="请确认当前会话存在，或稍后重试。"
                action={
                  <Button icon={<ReloadOutlined />} onClick={() => sessionDetailQuery.refetch()}>
                    重新加载
                  </Button>
                }
              />
            </Card>
          ) : null}

          {validSessionId !== null && selectedSession ? (
            <Space direction="vertical" size={18} className="debug-result-stack">
              <Card className="surface-card surface-card--muted" bordered={false}>
                <div className="knowledge-table-card__header">
                  <div>
                    <Typography.Title level={4}>
                      {selectedSession.title || '未命名会话'}
                    </Typography.Title>
                    <Typography.Paragraph>
                      {selectedSession.mode === 'knowledge'
                        ? '当前为知识库模式，回答会标注引用来源与命中情况。'
                        : '当前为 Agent 模式，回答会标注意图路由与工具调用。'}
                    </Typography.Paragraph>
                  </div>
                  <Space size={8} wrap>
                    <Tag color={selectedSession.mode === 'knowledge' ? 'cyan' : 'purple'}>
                      {selectedSession.mode}
                    </Tag>
                    {selectedSession.kbId ? (
                      <Tag color="default">kbId {selectedSession.kbId}</Tag>
                    ) : null}
                    {isClosed ? (
                      <Tag color="red">已关闭</Tag>
                    ) : (
                      <Button
                        danger
                        icon={<StopOutlined />}
                        onClick={() => closeSessionMutation.mutate()}
                        loading={closeSessionMutation.isPending}
                      >
                        关闭会话
                      </Button>
                    )}
                  </Space>
                </div>
                {isClosed ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="当前会话已关闭"
                    description="输入框已禁用。如需继续验证，请新建会话。"
                  />
                ) : null}
              </Card>

              <Card className="surface-card chat-messages-card" bordered={false}>
                <div className="knowledge-table-card__header">
                  <div>
                    <Typography.Title level={4}>消息列表</Typography.Title>
                    <Typography.Paragraph>
                      用户与助手的历史消息，含引用、意图与性能信息。
                    </Typography.Paragraph>
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      void sessionDetailQuery.refetch();
                      void messagesQuery.refetch();
                    }}
                    loading={messagesQuery.isFetching || sessionDetailQuery.isFetching}
                  >
                    刷新消息
                  </Button>
                </div>

                {messagesQuery.isLoading && !selectedSessionDetail?.messages?.length ? (
                  <ContentState
                    loading
                    title="正在加载消息"
                    description="系统正在读取当前会话最近消息。"
                  />
                ) : null}

                {!messagesQuery.isLoading && messagesQuery.isError ? (
                  <ContentState
                    error
                    title="消息列表加载失败"
                    description="请稍后重试，或检查消息分页接口。"
                    action={
                      <Button icon={<ReloadOutlined />} onClick={() => messagesQuery.refetch()}>
                        重新加载
                      </Button>
                    }
                  />
                ) : null}

                {!messagesQuery.isLoading &&
                !messagesQuery.isError &&
                !messageRecords.length &&
                !streamPreviewMessages.length ? (
                  <div className="knowledge-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="当前会话还没有消息"
                    />
                  </div>
                ) : null}

                {!messagesQuery.isLoading &&
                !messagesQuery.isError &&
                (messageRecords.length || streamPreviewMessages.length) ? (
                  <Space direction="vertical" size={14} className="chat-message-list">
                    {messageRecords.map((messageItem) => (
                      <div
                        key={messageItem.messageId}
                        className={`chat-message chat-message--${messageItem.role}`}
                      >
                        <div className="chat-message__avatar">
                          <Avatar>
                            {messageItem.role === 'user' ? 'U' : 'A'}
                          </Avatar>
                        </div>
                        <div className="chat-message__body">
                          <div className="chat-message__header">
                            <Typography.Text strong>
                              {messageItem.role === 'user' ? '用户' : '助手'}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {formatDateTime(messageItem.createdAt)}
                            </Typography.Text>
                          </div>
                          <Typography.Paragraph className="ask-answer__content">
                            {messageItem.content}
                          </Typography.Paragraph>
                          {messageItem.role === 'assistant'
                            ? renderAssistantMetadata(messageItem)
                            : null}
                        </div>
                      </div>
                    ))}

                    {streamPreviewMessages.map((messageItem) => (
                      <div
                        key={messageItem.messageId}
                        className={`chat-message chat-message--${messageItem.role}`}
                      >
                        <div className="chat-message__avatar">
                          <Avatar>
                            {messageItem.role === 'user' ? 'U' : 'A'}
                          </Avatar>
                        </div>
                        <div className="chat-message__body chat-message__body--pending">
                          <div className="chat-message__header">
                            <Typography.Text strong>
                              {messageItem.role === 'user' ? '用户' : '助手'}
                            </Typography.Text>
                            {messageItem.role === 'assistant' &&
                            !streamReplyReceived ? (
                              <Tag icon={<LoadingOutlined />} color="processing">
                                {activeStream?.phase === 'meta'
                                  ? '检索完成，生成中'
                                  : '正在思考'}
                              </Tag>
                            ) : null}
                          </div>
                          <Typography.Paragraph className="ask-answer__content">
                            {messageItem.content}
                          </Typography.Paragraph>
                          {messageItem.role === 'assistant' &&
                          (activeStream?.reply || activeStream?.meta)
                            ? renderAssistantMetadata(messageItem)
                            : null}
                        </div>
                      </div>
                    ))}

                    {(messagesQuery.data as PageResult<ChatMessage> | undefined)?.total ? (
                      <Pagination
                        size="small"
                        current={(messagesQuery.data as PageResult<ChatMessage>).pageNum}
                        pageSize={(messagesQuery.data as PageResult<ChatMessage>).pageSize}
                        total={(messagesQuery.data as PageResult<ChatMessage>).total}
                        onChange={(page: number) => setMessagePageNum(page)}
                      />
                    ) : null}
                  </Space>
                ) : null}
              </Card>

              <Card className="surface-card" bordered={false}>
                {sendMessageMutation.isError ? (
                  <Alert
                    className="chat-send-error"
                    type="error"
                    showIcon
                    message="消息发送失败"
                    description={sendMessageMutation.error?.message || '请稍后重试'}
                  />
                ) : null}
                {streamError ? (
                  <Alert
                    className="chat-send-error"
                    type="error"
                    showIcon
                    message="流式消息失败"
                    description={streamError}
                  />
                ) : null}
                <Form
                  form={messageForm}
                  layout="vertical"
                  onFinish={(values: { content: string }) => {
                    sendMessageMutation.mutate({
                      content: values.content.trim(),
                    });
                  }}
                >
                  <Form.Item
                    label="消息内容"
                    name="content"
                    rules={[
                      { required: true, message: '请输入消息内容' },
                      { min: 1, message: '消息不能为空' },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      disabled={isClosed}
                      placeholder={
                        isClosed
                          ? '当前会话已关闭，无法继续发送'
                          : selectedSession.mode === 'knowledge'
                            ? '输入问题，回答会基于知识库引用'
                            : '输入问题，由 Agent 路由意图并作答'
                      }
                    />
                  </Form.Item>
                  <Space size={12} wrap>
                    <Button
                      type="primary"
                      icon={isClosed ? <LockOutlined /> : <SendOutlined />}
                      disabled={isClosed || sendMessageMutation.isPending}
                      loading={streamSending}
                      onClick={() => {
                        void handleStreamSend();
                      }}
                    >
                      {isClosed ? '会话已关闭' : '流式发送'}
                    </Button>
                    <Button
                      htmlType="submit"
                      icon={isClosed ? <LockOutlined /> : <MessageOutlined />}
                      disabled={
                        isClosed || streamSending || sendMessageMutation.isPending
                      }
                      loading={sendMessageMutation.isPending}
                    >
                      {isClosed ? '会话已关闭' : '同步发送'}
                    </Button>
                    <Button
                      icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
                      danger={isRecording}
                      disabled={
                        isClosed ||
                        (streamSending && !isRecording) ||
                        sendMessageMutation.isPending
                      }
                      onClick={() => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          void startRecording();
                        }
                      }}
                    >
                      {isRecording ? '停止并发送' : '语音输入'}
                    </Button>
                    <Button
                      icon={<PictureOutlined />}
                      disabled={
                        isClosed ||
                        streamSending ||
                        isRecording ||
                        sendMessageMutation.isPending
                      }
                      onClick={() => imageInputRef.current?.click()}
                    >
                      图片输入
                    </Button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) {
                          void handleImageSend(file);
                        }
                      }}
                    />
                  </Space>
                  {!isClosed ? (
                    <Typography.Paragraph
                      type="secondary"
                      className="chat-send-hint"
                    >
                      「流式发送」走 SSE：先显示「正在思考 / 检索完成」，随后逐字输出（需后端开启
                      CHAT_SSE_TRUE_STREAMING；未开启时整段返回）。「同步发送」等待完整结果返回。
                      「语音输入」点击录音、再次点击停止并自动发送，先识别为文字再走同一问答链路（需后端开启
                      MEDIA_ASR_ENABLED）。
                    </Typography.Paragraph>
                  ) : null}
                </Form>
              </Card>
            </Space>
          ) : null}
        </Col>
      </Row>

      <ChatCreateSessionModal
        open={createModalOpen}
        knowledgeBases={knowledgeQuery.data as KnowledgeBase[] | undefined}
        loading={createSessionMutation.isPending}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={async (values) => {
          await createSessionMutation.mutateAsync(values);
        }}
      />
    </Space>
  );
}
