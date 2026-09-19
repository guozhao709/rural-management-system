# 健康模块用户端接口对接说明

> 适用范围：`nest_front/users` 健康功能。  
> 严格接口依据：[健康模块 API Contract](../../docs/module/health/api-contract.md)；设计基线见 [`api.md`](../../docs/module/health/api.md)。本文不新增或修改接口契约。

## 1. 对接边界

- API Base URL 来自 `src/app/config.ts` 的 `appConfig.apiBaseUrl`；开发默认值为 `http://localhost:3000`。
- 所有健康接口相对路径均以 `/api/health` 开头。
- 使用根级 `src/api/request.ts` 的 Axios 实例。它会在已有登录态时自动附加 `Authorization: Bearer <token>`，遇到 `401` 会走现有的刷新登录态流程；功能组件不得自行保存 Token 或拼装认证头。
- 后端统一返回 `ApiEnvelope<T>`：`{ code, message, data }`。Feature API 模块应从 `response.data.data` 取得业务数据；失败时读取 `response.data?.message`，不要假设业务数据存在。
- 服务端按 JWT 当前用户确定数据归属。请求中不得传 `userId`。
- ID 为正整数。路由参数和 `templateId` 应先转为 `number` 并校验，不能将 UUID 或任意字符串直接传给接口。

建议的调用层次：

```text
Health 页面 / Composable
        ↓
views/health/api/health.ts
        ↓
src/api/request.ts
        ↓
/api/health
```

## 2. Endpoint 速查

| 业务 | 方法与路径 | 必填输入 | 前端使用要点 |
| --- | --- | --- | --- |
| 获取档案 | `GET /profile` | — | `data` 可为 `null`，应进入建档引导而非报错。 |
| 保存档案 | `PUT /profile` | 当前完整表单状态 | 首次保存创建，后续保存更新。 |
| 查询记录 | `GET /metrics` | — | 支持 `metricType`、`templateId`、`from`、`to`、`page`、`pageSize`。 |
| 新增记录 | `POST /metrics` | 见第 3 节 | 不提交 `unit`，单位由后端决定。 |
| 删除记录 | `DELETE /metrics/:id` | 正整数 ID | 仅用于错误记录；删除后刷新当前列表与相关趋势。 |
| 查询趋势 | `GET /metrics/trend` | `metricType` 或 `templateId` | 血压为双序列，其他指标为单值序列。 |
| 查询模板 | `GET /metric-templates` | — | 支持 `active`、`page`、`pageSize`。 |
| 新建模板 | `POST /metric-templates` | 名称、指标名、单位、开始时间 | 模板属于当前用户。 |
| 模板详情 | `GET /metric-templates/:id` | 正整数 ID | 记录仍通过 `/metrics?templateId=…` 查询。 |
| 更新/结束模板 | `PATCH /metric-templates/:id` | 要修改字段 | 使用 `endedAt` 结束跟踪；无模板删除接口。 |
| 发起分析 | `POST /analyses` | 本次症状信息 | 异步模型调用可能较慢，必须展示提交中状态。 |
| 分析历史 | `GET /analyses` | — | 仅摘要，支持 `page`、`pageSize`。 |
| 分析详情 | `GET /analyses/:id` | 正整数 ID | 用于历史详情页。 |
| 知识列表/搜索 | `GET /knowledge` | — | 支持 `q`、`category`、`page`、`pageSize`。 |
| 知识详情 | `GET /knowledge/:id` | 正整数 ID | 展示正文及来源链接。 |

## 3. 指标写入的判别联合

以 `metricType` 选择表单及请求体，且只发送所属分支字段。

| `metricType` | 请求字段 | 禁止由客户端提交 |
| --- | --- | --- |
| `weight` | `value`, `measuredAt` | `unit`, `templateId`, `systolic`, `diastolic` |
| `temperature` | `value`, `measuredAt` | 同上 |
| `heart_rate` | `value`, `measuredAt` | 同上 |
| `blood_pressure` | `systolic`, `diastolic`, `measuredAt` | `value`, `unit`, `templateId` |
| `custom` | `templateId`, `value`, `measuredAt` | `unit`, `systolic`, `diastolic` |

`measuredAt` 传 ISO 8601 日期时间（含时区）；日期筛选 `from`、`to` 使用严格 Contract 中的日期格式。提交前做数值、必填和日期有效性校验，但以后端 Zod 校验结果为准。

## 4. 建议的 Feature Type 边界

将健康 DTO 放在 `src/views/health/types/`，不要放到根级 `src/types/`。下列是 UI 至少需要区分的形状：

```ts
type MetricType = 'weight' | 'temperature' | 'heart_rate' | 'blood_pressure' | 'custom'
type TrendDirection = 'up' | 'down' | 'flat'

interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

interface HealthProfile {
  id: number
  sex: 'male' | 'female' | null
  birthDate: string | null
  heightCm: number | null
  smokingStatus: string | null
  drinkingStatus: string | null
  exerciseStatus: string | null
  sleepStatus: string | null
  healthHistory: string | null
  allergies: string | null
  createdAt: string
  updatedAt: string
}
```

指标记录、趋势、模板、分析和知识的完整字段以严格 API Contract 的示例为准。尤其应将单值趋势与血压趋势定义成联合类型，而不是以大量可选字段渲染同一图表。

```ts
type SingleValueTrend = {
  target: { type: Exclude<MetricType, 'blood_pressure' | 'custom'> | 'custom'; unit: string }
  points: Array<{ measuredAt: string; value: number }>
  statistics: { latest: number; average: number; min: number; max: number; change: number; trend: TrendDirection }
}

type BloodPressureTrend = {
  target: { type: 'blood_pressure'; unit: 'mmHg' }
  points: Array<{ measuredAt: string; systolic: number; diastolic: number }>
  statistics: {
    systolic: SingleValueTrend['statistics']
    diastolic: SingleValueTrend['statistics']
  }
}
```

## 5. AI 分析的前端约束

- `POST /analyses` 只提交 `symptoms`、`severity`、`duration`、`description`，不能把档案、BMI、既往记录或任何 `userId` 拼入请求。
- 成功后展示结构化的 `summary`、`concerns`、`factors`、`suggestions`、`medicalAdvice`、`references`；引用仅使用返回的 `knowledgeId`、`title`、`source`。
- 请求失败、模型不可用或结构化输出无效是失败状态，不得在界面上替换成“正常”“风险低”或伪造分析结果。保留用户填写内容，提供重试入口。
- 分析内容仅作健康信息展示；UI 文案不得呈现为诊断、概率结论、处方或用药剂量建议。

## 6. 错误与刷新规则

| 场景 | UI 行为 |
| --- | --- |
| `400` 参数校验失败 | 保留输入，定位或提示可修改字段，展示服务端 `message`。 |
| `401` | 交给现有 Axios 刷新/登出机制；页面不自行反复重试。 |
| `404` | 对列表跳转/已删除资源显示“不存在或无权访问”，返回安全页面。 |
| 网络失败、`5xx` | 保留已输入内容并显示可重试错误；不要清空本地表单。 |
| 删除成功 | 关闭确认状态，刷新记录列表、分页总数及受影响趋势。 |
| 保存/创建成功 | 以接口响应为准更新页面，避免乐观写入服务端生成字段。 |

## 7. 本地联调前提

1. 启动 `nest_server`，并在用户端配置有效的 `VITE_API_BASE_URL`。
2. 使用正常用户端登录流程取得 JWT；无需也不得将 LLM 密钥写入前端环境变量。
3. AI 分析依赖后端 LLM 配置；健康知识列表需后端已有已发布知识。开发环境可由后端 `pnpm seed:health-knowledge` 准备演示数据。
4. 前端只依赖上述 Contract；不得调用旧 Nest 健康路由或 Legacy Express 路由。
