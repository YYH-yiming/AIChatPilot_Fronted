import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

import type { KnowledgeBase, KnowledgeBasePayload } from '../../types/knowledge';

type KnowledgeBaseFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: KnowledgeBase | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: KnowledgeBasePayload) => Promise<void> | void;
};

export function KnowledgeBaseFormModal({
  open,
  mode,
  initialValues,
  confirmLoading = false,
  onCancel,
  onSubmit,
}: KnowledgeBaseFormModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      embeddingModel: initialValues?.embeddingModel ?? '',
    });
  }, [form, initialValues, open]);

  const handleFinish = async () => {
    const values = await form.validateFields();
    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      embeddingModel: values.embeddingModel?.trim() || undefined,
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '新建知识库' : '编辑知识库'}
      okText={mode === 'create' ? '创建' : '保存'}
      cancelText="取消"
      confirmLoading={confirmLoading}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleFinish}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="知识库名称"
          name="name"
          rules={[
            { required: true, message: '请输入知识库名称' },
            { max: 200, message: '名称不能超过 200 个字符' },
          ]}
        >
          <Input placeholder="例如：客服 FAQ、产品手册、制度规范" />
        </Form.Item>
        <Form.Item
          label="描述"
          name="description"
          rules={[{ max: 2000, message: '描述不能超过 2000 个字符' }]}
        >
          <Input.TextArea
            rows={4}
            showCount
            maxLength={2000}
            placeholder="说明知识库用途、来源范围或适用业务线"
          />
        </Form.Item>
        <Form.Item
          label="Embedding 模型"
          name="embeddingModel"
          rules={[{ max: 200, message: '模型名不能超过 200 个字符' }]}
        >
          <Input placeholder="例如：bge-large-zh-v1.5" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
