# M09 健康评估与健康知识接口文档

## 1. 使用范围

本文档描述当前已实现的 M09 后端接口，供用户端和管理端前端联调使用。服务定位为健康信息记录、就医引导和公共健康科普，不提供疾病诊断、概率、处方或具体药物建议。

基础路径：`/api/v2`

## 2. 通用约定

### 2.1 认证

用户端接口使用：

```http
Authorization: Bearer <用户 Access Token>
```

管理端接口使用：

```http
Authorization: Bearer <管理员 Access Token>
```

健康资源所有权由 Access Token 决定。请求体、查询参数和路径中不应传入 `userId`、手机号或年龄。

### 2.2 响应结构

除 `204 No Content` 外，响应统一为：

```json
{
  "code": 200,
  "message": "请求成功",
  "data": {}
}
```

错误响应的 `data` 固定为 `null`：

```json
{
  "code": 404,
  "message": "健康评估不存在",
  "data": null
}
```

### 2.3 常用状态码

| 状态码 | 含义 | 前端建议 |
| --- | --- | --- |
| `400` | 请求参数有误 | 展示字段校验提示。 |
| `401` | 未登录或认证未通过 | 跳转登录。 |
| `403` | 管理端角色不足 | 提示无权限，不重试。 |
| `404` | 资源不存在或不属于当前用户 | 统一按「未找到」处理。 |
| `503` | 健康同意、加密、规则或 AI 能力未启用 | 显示「暂时无法评估」，不得显示低风险。 |

## 3. 用户端接口

所有接口均要求用户 Access Token。

### 3.1 健康同意

#### 创建或更新当前同意

```http
POST /api/v2/health/consents
```

```json
{
  "noticeVersion": "1.0",
  "scopes": ["profile", "measurement", "assessment", "ai_processing"]
}
```

`scopes` 可选值：`profile`、`measurement`、`assessment`、`ai_processing`。至少选择一项；只有选择 `ai_processing` 后，且服务端 AI 开关开启时，评估才可能调用 AI 说明。

响应 `data`：

```json
{
  "id": "12",
  "noticeVersion": "1.0",
  "scopes": ["profile", "measurement", "assessment", "ai_processing"],
  "grantedAt": "2026-08-25T08:00:00.000Z"
}
```

#### 获取当前同意

```http
GET /api/v2/health/consents/current
```

未同意时返回 `data: null`。

#### 撤回当前同意

```http
DELETE /api/v2/health/consents/current
```

成功返回 `204 No Content`。撤回后，后续档案、测量和评估写入会被拒绝。

### 3.2 健康档案

#### 获取档案

```http
GET /api/v2/health/profile
```

```json
{
  "medicalHistory": null,
  "allergies": null,
  "specialPopulation": null,
  "updatedAt": null
}
```

#### 部分更新档案

```http
PATCH /api/v2/health/profile
```

```json
{
  "medicalHistory": "既往健康情况说明",
  "allergies": null,
  "specialPopulation": "特殊人群说明"
}
```

字段省略表示保持原值；显式传 `null` 表示清空。字段最大长度分别为 `2000`、`1000`、`1000` 个字符。

### 3.3 健康测量

#### 新增测量

```http
POST /api/v2/health/measurements
```

公共字段：

```json
{
  "type": "body_temperature",
  "source": "self_reported",
  "measuredAt": "2026-08-25T08:00:00.000Z",
  "values": { "value": 36.5, "unit": "celsius" }
}
```

`source`：`self_reported`、`manual_device`、`connected_device`。

`values` 必须与 `type` 对应：

| `type` | `values` 示例 | 固定单位 |
| --- | --- | --- |
| `blood_pressure` | `{ "systolic": 120, "diastolic": 80, "unit": "mmHg" }` | `mmHg` |
| `body_temperature` | `{ "value": 36.5, "unit": "celsius" }` | `celsius` |
| `heart_rate` | `{ "value": 70, "unit": "bpm" }` | `bpm` |
| `body_weight` | `{ "value": 65, "unit": "kg" }` | `kg` |
| `body_height` | `{ "value": 170, "unit": "cm" }` | `cm` |

服务端拒绝未来测量时间和不符合固定单位/值域的输入。

#### 分页查询测量

```http
GET /api/v2/health/measurements?type=body_weight&from=2026-08-01T00:00:00.000Z&to=2026-08-31T23:59:59.000Z&page=1&pageSize=20
```

`type`、`from`、`to` 可省略；`page` 默认为 `1`，`pageSize` 默认为 `20`，最大为 `100`。结果按 `measuredAt` 倒序。

```json
{
  "list": [{
    "id": "18",
    "type": "body_weight",
    "source": "self_reported",
    "measuredAt": "2026-08-25T08:00:00.000Z",
    "values": { "value": 65, "unit": "kg" },
    "createdAt": "2026-08-25T08:01:00.000Z"
  }],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

#### 查询趋势序列

```http
GET /api/v2/health/measurements/trends?type=body_weight&range=30d
```

`range` 只能为 `7d`、`30d` 或 `90d`。返回指定窗口内按测量时间正序排列的测量数组，前端可自行绘制趋势图。

#### 删除测量

```http
DELETE /api/v2/health/measurements/:id
```

成功返回 `204 No Content`。采用软删除。

### 3.4 健康评估

#### 创建评估

```http
POST /api/v2/health/assessments
```

```json
{
  "idempotencyKey": "4ad4ba30-5bf0-4ff5-bf2f-2d94aa0bf442",
  "symptoms": [{
    "code": "chest_discomfort",
    "severity": "moderate",
    "startedAt": "2026-08-25T08:00:00.000Z",
    "course": "persistent"
  }],
  "otherDetails": "活动后更明显",
  "measurementIds": ["18"]
}
```

症状 `code`：`chest_discomfort`、`difficulty_breathing`、`loss_of_consciousness`、`seizure`、`fever`、`cough`、`fatigue`、`dizziness`、`headache`、`other`。

`severity`：`mild`、`moderate`、`severe`；`course`：`new`、`intermittent`、`persistent`。`measurementIds` 中的每一条记录必须属于当前用户。

相同用户重复提交相同 `idempotencyKey` 时，返回首次创建的评估，不会创建重复记录。每日上限由服务端配置控制。

响应 `data`：

```json
{
  "id": "b1b31753-c1f4-46f3-9ab4-727b1b65a72e",
  "status": "succeeded",
  "triage": {
    "level": "emergency",
    "reasonCodes": ["NHC-2024-chest_discomfort"],
    "message": "当前症状可能需要紧急医疗救助，请立即拨打 120 或前往急诊。"
  },
  "result": {
    "schemaVersion": "1.0",
    "triage": { "level": "emergency", "reasonCodes": ["NHC-2024-chest_discomfort"], "message": "当前症状可能需要紧急医疗救助，请立即拨打 120 或前往急诊。" },
    "summary": "当前信息提示应立即获得紧急医疗帮助。",
    "factors": ["已命中安全分诊规则。"],
    "nextActions": ["立即拨打 120 或前往急诊。"],
    "selfCare": [],
    "warningSignals": ["出现呼吸困难、意识异常或症状明显加重时立即求助。"],
    "knowledgeReferences": [],
    "limitations": ["本结果不构成诊断。"],
    "aiGenerated": false,
    "generatedAt": "2026-08-25T08:01:00.000Z"
  },
  "aiGenerated": false,
  "ruleVersion": "development-nhc-health-literacy-2024.1",
  "createdAt": "2026-08-25T08:01:00.000Z",
  "completedAt": "2026-08-25T08:01:00.000Z"
}
```

`triage.level`：`emergency`、`urgent`、`routine`、`self_care`、`insufficient`。前端仅能依据此字段展示紧急状态；不得根据 AI 文本推断紧急程度。

当 `triage.level` 为 `emergency` 时，应在结果最顶部立即展示「拨打 120 或前往急诊」；不得等待 AI 文本。`aiGenerated: false` 表示固定安全说明，`true` 表示通过安全校验的 AI 说明。

#### 查询评估历史

```http
GET /api/v2/health/assessments?page=1&pageSize=20&triageLevel=insufficient
```

`triageLevel` 可省略。返回 `{ list, total, page, pageSize }`；每一项的结构与创建评估响应 `data` 相同。

#### 查询评估详情

```http
GET /api/v2/health/assessments/:id
```

#### 删除评估

```http
DELETE /api/v2/health/assessments/:id
```

成功返回 `204 No Content`。采用软删除。

### 3.5 公共健康知识

#### 搜索已发布知识

```http
GET /api/v2/health/knowledge?keyword=急救&page=1&pageSize=20
```

只返回已发布且尚未达到复核日期的知识。当前接口使用 `keyword`、`page`、`pageSize`；不支持向用户端传入状态或审核信息。

```json
[{ 
  "knowledgeId": 12,
  "version": 1,
  "title": "出现紧急情况时及时寻求医疗帮助",
  "excerpt": "如出现突发意识异常……",
  "sourceName": "国家卫生健康委员会……",
  "sourceUrl": "https://www.nhc.gov.cn/...",
  "reviewedAt": "2026-08-25T08:00:00.000Z",
  "score": 1
}]
```

#### 获取已发布知识详情

```http
GET /api/v2/health/knowledge/:id
```

返回单条公共知识摘要；草稿、送审中、已归档或已过复核期内容统一返回 `404`。

## 4. 管理端健康知识接口

所有接口使用管理员 Access Token。`admin` 可创建、编辑草稿和送审；`super_admin` 才可发布或归档。当前不提供管理员查询个人健康档案、测量或评估详情的接口。

### 4.1 查询知识版本

```http
GET /api/v2/admin/health/knowledge?page=1&pageSize=20&status=draft
```

### 4.2 创建草稿

```http
POST /api/v2/admin/health/knowledge
```

```json
{
  "topic": "科学就医与紧急求助",
  "title": "出现紧急情况时及时寻求医疗帮助",
  "body": "健康科普正文",
  "sourceName": "国家卫生健康委员会",
  "sourceUrl": "https://www.nhc.gov.cn/..."
}
```

### 4.3 修改草稿

```http
PATCH /api/v2/admin/health/knowledge/:id
```

请求体与创建草稿相同。已发布版本不会被直接修改，系统会创建新草稿版本；送审中版本不可修改。

### 4.4 送审

```http
POST /api/v2/admin/health/knowledge/:id/submit-review
```

无需请求体。

### 4.5 发布

```http
POST /api/v2/admin/health/knowledge/:id/publish
```

仅 `super_admin` 可调用。

```json
{
  "reviewedAt": "2026-08-25T08:00:00.000Z",
  "reviewDueAt": "2027-08-25T08:00:00.000Z"
}
```

缺少可核验来源、审核信息或未来复核日期时，服务端拒绝发布。发布动作不等同于专业审核资质确认；生产使用仍需保留可检查的专业审核记录。

### 4.6 归档与待复核列表

```http
POST /api/v2/admin/health/knowledge/:id/archive
GET /api/v2/admin/health/knowledge/review-due
```

归档仅 `super_admin` 可调用。待复核列表返回已发布但复核日期已到的版本。

## 5. 前端安全要求

- 不保存或传递用户身份字段给健康接口。
- `503`、非法响应和 `insufficient` 必须显示「暂时无法评估」或信息不足，不得默认显示低风险。
- 不展示疾病概率、药物、剂量或处方建议。
- 仅当 `result.aiGenerated === true` 时显示 AI 生成标识。
- 紧急状态只依赖 `triage.level === "emergency"`，并优先显示 120 提示。
- 用户撤回同意后，应清空本地健康页面状态，并停止健康数据提交。

## 6. 当前能力边界

- 开发环境可以使用开发参考分诊规则；生产环境没有专业审核规则时，个性化评估保持不可用。
- AI 说明仅在服务端启用、用户具有 `ai_processing` 同意且非紧急结果时尝试调用；失败时返回固定安全说明。
- 目前未提供用户端的健康档案、测量和评估导出接口。
- 旧系统接口迁移未实施，前端应只调用本文档中的 V2 接口。
