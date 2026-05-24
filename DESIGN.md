<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: AIChatPilot Frontend
description: 面向企业知识库、RAG 与 Agent 调试的智能运营工作台
---

# Design System: AIChatPilot Frontend

## Overview

**Creative North Star: "The Calm Control Room"**

这是一个为长时间桌面工作流服务的产品界面系统。它的目标不是制造 AI 感，也不是把复杂能力包装成轻巧错觉，而是把知识库构建、检索调试、链路验证和运营分析这些高密度任务，组织成一个冷静、可靠、可判断的工作环境。

整体气质必须专业、克制、可信。视觉上应偏向安静的中性色基底，加一支柔和但有辨识度的强调色，用来标识主操作、当前选择和关键状态，而不是制造存在感。交互应当快速响应，但不表演，不编排，不用情绪化动效干扰判断。

这个系统明确拒绝蓝紫渐变、发光描边、玻璃拟态等常见 AI 模板风，也拒绝“首页像 SaaS 落地页、功能页却很弱”的失衡方向。它也不能退化成只有聊天框的 AI 壳子，知识库、调试、分析和系统状态必须作为一等能力被清楚表达。

**Key Characteristics:**
- 高密度但有秩序
- 安静、可信的中性基底
- 柔和强调而非高饱和刺激
- 优先支持诊断、验证与定位问题
- 熟悉、稳定、产品化的交互语言

## Colors

配色策略采用克制型，以带轻微色相倾向的中性色为底，只保留一支柔和强调色承担主操作和关键状态。

### Primary
- **Soft Deep Teal** ([to be resolved during implementation]): 用于主按钮、当前选中、重点状态提示和局部数据高亮。它必须克制、稳定、可长期观看，不能显得霓虹、艳丽或科技营销化。

### Neutral
- **Tinted Paper** ([to be resolved during implementation]): 用于主内容背景，避免纯白，保留轻微冷暖倾向以降低刺眼感。
- **Quiet Surface** ([to be resolved during implementation]): 用于侧边栏、工具栏、分区面板和次级容器，和主背景形成轻层次区别，而不是靠重阴影分隔。
- **Measured Ink** ([to be resolved during implementation]): 用于正文、表格内容、标题、说明文字，确保长时间阅读下的稳定性与对比度。
- **Soft Grid** ([to be resolved during implementation]): 用于边界线、分割线、表格栅格和弱化状态，存在感必须低于内容本身。

**The Restrained Signal Rule.** 强调色在任意单屏中的面积必须保持稀缺。它只为主要操作、当前焦点和系统状态服务，禁止把强调色当作装饰铺满界面。

## Typography

**Display Font:** [不设展示字体，产品界面不需要展示型排版]
**Body Font:** 无衬线系统字体方向（[font pairing to be chosen at implementation]）
**Label/Mono Font:** 等宽字体用于日志、代码片段、检索命中信息和引用元数据（[font pairing to be chosen at implementation]）

**Character:** 排版应当清晰、压缩、稳定，首先服务扫描效率和连续工作。正文与标签不追求风格表演，重点在于信息层级准确、表格可读、状态对比明确。

### Hierarchy
- **Headline** ([to be defined during implementation]): 用于页面标题和大区块标题，强调结构而不是情绪。
- **Title** ([to be defined during implementation]): 用于卡片级标题、面板标题、表格区块标题。
- **Body** ([to be defined during implementation]): 用于说明文字、字段内容、配置描述与引用说明，连续文本控制在可读范围内。
- **Label** ([to be defined during implementation]): 用于按钮、表头、状态标签、筛选项和辅助说明，要求紧凑、清楚、可快速扫读。
- **Mono** ([to be defined during implementation]): 用于日志、索引状态、命中详情、文档切片标识、路由与调试信息。

**The No Display Type Rule.** 这是工作台，不是品牌海报。禁止使用展示型字体、夸张字重对比或过度放大的标题来制造存在感。

## Elevation

这个系统应以平面分层为主，依靠背景层级、边界线和密度组织建立结构，而不是依赖厚重阴影。Responsive 动效只用于状态反馈，因此深度表达也应偏结构性而非戏剧性。

**The Flat-By-Default Rule.** 所有静态界面默认保持平面。只有在悬停、焦点、展开或拖拽等明确交互状态下，才允许出现极轻的抬升感。

## Do's and Don'ts

### Do:
- **Do** 使用带轻微色相偏移的中性色背景，而不是纯黑或纯白，让长时间桌面使用更稳定。
- **Do** 让主操作、当前选中、索引状态、检索命中与引用来源拥有明确层级，并在表格、标签、图表和引用区中维持足够对比度。
- **Do** 使用无衬线主字体配合等宽字体承接日志、调试、检索和引用信息，让系统更像工具而不是宣传页。
- **Do** 保持交互反馈快速且克制，使用短促过渡表达 hover、focus、active、loading、error 等状态变化。
- **Do** 让知识库、调试、分析、聊天验证这些能力并列可见，不把关键系统能力藏在单一路径里。

### Don't:
- **Don't** 使用蓝紫渐变、发光描边、玻璃拟态等常见 AI 模板风格。
- **Don't** 采用首页很重品牌包装、功能页却缺乏深度的“重品牌轻产品”模式。
- **Don't** 退化成只有一个聊天框的极简 AI 壳子，把知识库、调试、分析能力都藏起来。
- **Don't** 采用全黑配色或过度依赖暗色氛围来制造“技术感”。
- **Don't** 用高饱和强调色大面积铺陈按钮、标签、卡片或导航，让界面看起来像营销物料而不是企业工作台。
