/**
 * 全局 message 持有器。
 *
 * antd v5 的静态 `message.xxx()` 无法消费 ConfigProvider 上下文，会触发
 * “Static function can not consume context like dynamic theme” 告警。
 * 组件内统一用 `App.useApp()`；而 `utils/request.ts` 等非组件模块无法用 Hook，
 * 因此由 `AppProviders` 在挂载后把 `App.useApp()` 的 message 实例注入到这里，
 * 供这些模块通过 `notifyError` 调用，从而走主题上下文且不再产生静态告警。
 */

// 仅声明本模块用到的能力，结构化兼容 antd 的 MessageInstance，避免深层类型导入。
type MessageApi = {
  error: (content: string) => void;
};

let messageInstance: MessageApi | null = null;

export function setMessageInstance(instance: MessageApi) {
  messageInstance = instance;
}

export function notifyError(content: string) {
  messageInstance?.error(content);
}
