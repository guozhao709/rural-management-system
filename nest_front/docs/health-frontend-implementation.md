# 健康模块用户端实现说明

> 适用范围：健康模块的用户端实现规划与验收。  
> 前置阅读：[接口对接说明](health-api-integration.md)、[用户端 UI 规范](ui/userUI.md)、[前端结构规范](srcSturcture/index.md)。

## 1. 目标与不在范围内的事项

健康用户端覆盖：健康档案、指标记录与趋势、自定义指标模板、AI 分析及历史、健康知识浏览。所有功能通过已冻结的 14 个用户侧健康接口完成。

本次前端实施不应：

- 新增 Dashboard、BMI、专项指标历史等后端接口；派生趋势直接使用 `/metrics/trend` 返回的数据。
- 直接访问数据库、在浏览器计算或存储其他用户健康数据，或把 `userId` 写入请求。
- 在前端调用 LLM、暴露后端 LLM 配置或伪造分析结果。
- 调用已移除的旧健康运行时代码、旧路由或 Legacy API。

## 2. 推荐目录与状态所有权

```text
src/views/health/
├── index.vue                     # 健康功能页面入口
├── api/health.ts                 # 全部健康 HTTP Endpoint 与 DTO 映射
├── types/health.ts               # Contract DTO、领域 Type、View Model
├── composables/
│   ├── useHealthProfile.ts
│   ├── useHealthMetrics.ts
│   ├── useHealthAnalysis.ts
│   └── useHealthKnowledge.ts
├── components/
│   ├── ProfileForm.vue
│   ├── MetricRecordForm.vue
│   ├── MetricHistory.vue
│   ├── MetricTrendChart.vue
│   ├── MetricTemplatePanel.vue
│   ├── AnalysisForm.vue
│   ├── AnalysisResult.vue
│   └── KnowledgeList.vue
└── utils/
    └── health-formatters.ts
```

这些目录按实际页面拆分，不必机械创建。单个页面的输入、弹层和加载状态使用 `ref`/`reactive`；仅当多个健康子页面需要共享复杂、长期状态时再建立 `views/health/stores/`。根级 Store 不保存健康业务数据。

页面组件只调用 Feature Composable 或 `api/health.ts` 暴露的方法，不能直接使用 Axios。HTTP DTO、领域模型和展示模型语义不同时应显式转换，避免 `any` 或断言掩盖差异。

## 3. 页面与数据流

路由名称、导航位置和最终视觉布局仍应遵循用户端 UI 设计；下列是接口支持的业务分区，而非新增路由 Contract。

| 分区 | 初始请求 | 用户动作 | 成功后的同步 |
| --- | --- | --- | --- |
| 健康档案 | `GET /profile` | 保存完整档案 | 用 `PUT /profile` 响应替换本地档案。无档案时显示建档状态。 |
| 指标记录 | `GET /metrics`、模板列表 | 新增、筛选、分页、删除 | 新增或删除后刷新当前列表；当前图表目标受影响时刷新趋势。 |
| 趋势图 | `GET /metrics/trend` | 选择系统指标或一个模板、日期范围 | 根据响应联合类型渲染单线/双线图，空 `points` 显示无数据状态。 |
| 自定义模板 | `GET /metric-templates` | 新建、重命名、结束跟踪 | 保存后刷新模板选择器和模板列表。 |
| AI 分析 | 无需预加载上下文 | 提交本次症状 | 禁用重复提交；成功展示结果，并让历史列表重新获取。 |
| 分析历史 | `GET /analyses` | 分页、打开详情 | 详情按需 `GET /analyses/:id`，不得由列表摘要拼出详情。 |
| 健康知识 | `GET /knowledge` | 搜索、分类、分页、查看详情 | 查询变化需取消或忽略过期请求，详情按需获取。 |

## 4. 关键交互规则

### 指标

- 新增记录前先选择指标类型。血压表单只出现收缩压和舒张压；自定义指标必须先选择当前用户模板；其他系统指标只出现单一数值输入。
- 单位作为只读显示：系统指标由类型确定，自定义指标来自已选模板。单位不进入请求体。
- 删除是“删除后重录”，不提供记录编辑入口。删除必须二次确认，并且失败时保留当前列表。
- 图表以接口 `measuredAt` 排序后的 `points` 为数据源。血压使用收缩压、舒张压两条序列，不能合并成一个数值。

### 档案与分析

- 档案字段允许为空时，表单应支持“未知/未填写”，并按 `null` 传递，不能用伪造数值替代。
- 分析表单只收集本次情况。提交期间应避免重复点击；如调用失败，保留表单并允许显式重试。
- 分析结果展示应有醒目的非诊断性质提示。引用项目可跳转到健康知识详情，外部来源链接应由用户主动打开。

### 列表与空状态

- 列表必须区分：首次加载、加载失败、空数据、分页加载、刷新中。空数据不是错误。
- 筛选条件（指标、模板、日期、知识关键字/分类）应有一个明确 State Owner，并在切换条件时回到第一页。
- 路由 ID 无效、资源已删除、或无权访问时，显示可恢复的 404 状态，不渲染旧缓存内容为当前资源。

## 5. 交付检查表

- [ ] Feature 所有 HTTP 调用集中在 `views/health/api/health.ts`，且使用根级 `request`。
- [ ] `ApiEnvelope<T>` 已被正确解包；未将 Axios `response` 直接传入组件。
- [ ] 14 个 Contract Endpoint 均有对应前端调用点或有明确的未实现标记。
- [ ] 各类指标请求使用判别联合，血压与自定义指标的字段组合正确。
- [ ] 所有 ID、日期、分页和筛选输入在 UI 层有基本校验；后端失败信息可见且可恢复。
- [ ] 所有受认证保护的请求复用现有刷新/登出机制；前端未保存 LLM 密钥或自定义 Authorization Header。
- [ ] 组件测试覆盖：档案空态与保存、五类指标请求构造、趋势两种响应、AI 失败保留输入、列表筛选和删除失败。
- [ ] 浏览器验收覆盖：登录后建档、记录/删除一条指标、趋势切换、创建并结束模板、生成并查看分析历史、知识搜索与详情。

## 6. 验证与联调边界

实现前端代码后，至少按 [前端验证规范](validation/index.md) 执行相关组件测试、`pnpm typecheck`、`pnpm lint`、`pnpm build`；改变路由、表单或可见交互时增加用户端浏览器 E2E。Mock 可以用于组件测试中的网络边界，但不能作为真实后端或模型联调通过的证据。

后端返回的 AI 文本属于不可信外部输出：按纯文本渲染或经过严格白名单富文本处理，不将其作为 HTML 直接注入页面。

