import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';

import type { ChatMode, CreateChatSessionPayload } from '../../types/chat';
import type { KnowledgeBase } from '../../types/knowledge';

type ChatCreateSessionModalProps = {
  open: boolean;
  knowledgeBases?: KnowledgeBase[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateChatSessionPayload) => Promise<void> | void;
};

type ChatSessionFormValues = {
  title?: string;
  mode: ChatMode;
  kbId?: number;
};

export function ChatCreateSessionModal({
  open,
  knowledgeBases,
  loading = false,
  onCancel,
  onSubmit,
}: ChatCreateSessionModalProps) {
  const [form] = Form.useForm();
  const mode = Form.useWatch('mode', form);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: '',
        mode: 'agent',
        kbId: undefined,
      });
    }
  }, [form, open]);

  const handleOk = async () => {
    const values = (await form.validateFields()) as ChatSessionFormValues;
    await onSubmit({
      title: values.title?.trim() || undefined,
      mode: values.mode,
      kbId: values.mode === 'knowledge' ? values.kbId : undefined,
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title="新建会话"
      okText="创建会话"
      cancelText="取消"
      confirmLoading={loading}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleOk}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ mode: 'agent' }}>
        <Form.Item label="标题（可选）" name="title">
          <Input placeholder="不填则由后端生成默认标题" />
        </Form.Item>
        <Form.Item
          label="模式"
          name="mode"
          rules={[{ required: true, message: '请选择会话模式' }]}
        >
          <Select
            options={[
              { label: 'Agent', value: 'agent' },
              { label: 'Knowledge', value: 'knowledge' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="知识库"
          name="kbId"
          dependencies={['mode']}
          rules={[
            {
              validator: async (_rule, value: number | undefined) => {
                if (mode === 'knowledge' && !value) {
                  throw new Error('Knowledge 模式需选择要绑定的知识库');
                }
              },
            },
          ]}
        >
          <Select
            allowClear
            disabled={mode !== 'knowledge'}
            placeholder={
              mode === 'knowledge'
                ? '选择要绑定的知识库'
                : 'agent 模式无需选择知识库'
            }
            options={knowledgeBases?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
