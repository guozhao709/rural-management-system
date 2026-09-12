# M08 农业模块接口文档

## 1. 范围

本文档说明 M08「农业分析与农业知识」模块当前已实现的 HTTP API，供前端页面联调使用。接口前缀为 `/api/v2`，统一返回 JSON。

当前没有接入实时天气。农业分析结果中的 `contextWarnings` 可能包含「实时天气未接入」，前端应直接展示该提示，不应将分析结果标记为实时建议。

## 2. 通用约定

### 2.1 认证

用户端接口使用用户 Access Token：

```http
Authorization: Bearer <user-access-token>
```

管理端接口使用管理员 Access Token：

```http
Authorization: Bearer <admin-access-token>
```

用户端不能使用管理员 Token；管理端不能使用用户 Token。

### 2.2 成功响应

除特别说明外，响应结构如下：

```json
{
  "code": 200,
  "message": "请求成功",
  "data": {}
}
```

`code` 与 HTTP 状态码保持一致。创建成功通常为 `201`。

### 2.3 失败响应

```json
{
  "code": 400,
  "message": "请求参数有误",
  "data": null
}
```

常用状态码：

| HTTP 状态 | 含义 |
| --- | --- |
| 400 | 参数校验失败，或知识状态不允许当前操作 |
| 401 | Token 缺失、无效或身份类型不匹配 |
| 403 | 管理员角色不足 |
| 404 | 作物、知识或本人分析记录未找到 |
| 409 | 作物编码、别名或作物关联发生重复或冲突 |
| 429 | 超出当天农业分析限额 |
| 502 | LLM 上游网络异常、返回内容无效或不符合结果结构 |
| 503 | 农业分析被关闭，或 LLM 未完成配置 |
| 504 | LLM 请求超时 |

### 2.4 分页

列表接口都支持以下参数：

| 参数 | 类型 | 默认值 | 范围 |
| --- | --- | --- | --- |
| `page` | number | `1` | 最小为 `1` |
| `pageSize` | number | `20` | `1` 至 `100` |

分页响应：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## 3. 用户端 API

所有本节接口均需要用户 Access Token。

### 3.1 查询启用作物

```http
GET /api/v2/agriculture/crops?keyword=小麦&page=1&pageSize=20
```

仅返回状态为 `active` 的作物。`keyword` 可匹配作物名称或别名。

`data.list` 项：

```json
{
  "id": 1,
  "code": "wheat",
  "name": "小麦",
  "scientificName": null,
  "status": "active",
  "aliases": [
    { "id": 1, "alias": "麦子" }
  ]
}
```

### 3.2 查询已发布农业知识

```http
GET /api/v2/agriculture/knowledge?keyword=排水&cropId=1&category=种植管理&tag=田间管理&regionCode=610116&page=1&pageSize=20
```

只返回已发布、未删除且未过期的知识。列表不含正文 `content`。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `keyword` | string | 标题或正文关键词，最长 100 字符 |
| `cropId` | number | 作物 ID |
| `category` | string | 知识分类，最长 32 字符 |
| `tag` | string | 单个标签，最长 64 字符 |
| `regionCode` | string | 适用行政区代码，最长 32 字符 |

列表项：

```json
{
  "id": 12,
  "title": "小麦：基础田间管理与风险提示",
  "summary": "按苗情、墒情和目标产量实施测土配方与分期肥水管理。",
  "category": "种植管理",
  "tags": ["田间管理", "风险提示"],
  "regionCodes": [],
  "sourceName": "农业农村部/全国农技中心技术指导意见（S1）",
  "sourceUrl": "https://example.com/source",
  "validUntil": null,
  "version": 1,
  "status": "published",
  "cropIds": [1]
}
```

### 3.3 查询农业知识详情

```http
GET /api/v2/agriculture/knowledge/:id
```

仅可读取已发布、未过期知识；草稿、已归档或无权可见的知识统一返回 `404`。返回字段与列表项一致，额外包含 `content`。

### 3.4 创建农业分析

```http
POST /api/v2/agriculture/analyses
Content-Type: application/json
```

请求体：

```json
{
  "cropId": 1,
  "regionCode": "610116",
  "regionName": "陕西省西安市长安区",
  "growthStage": "jointing",
  "observations": ["叶尖轻微发黄"],
  "fieldContext": {
    "soilType": "loess",
    "irrigationAvailable": true
  }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `cropId` | 是 | 启用作物 ID |
| `regionCode` | 是 | 行政区或业务地区代码，最长 32 字符 |
| `regionName` | 是 | 地区名称，最长 255 字符 |
| `growthStage` | 否 | 生育期，最长 64 字符 |
| `observations` | 否 | 田间观察数组，最多 20 项 |
| `fieldContext.soilType` | 否 | 土壤类型，最长 100 字符 |
| `fieldContext.irrigationAvailable` | 否 | 是否具备灌溉条件 |

请求体不接受 `userId`。分析所属用户始终由 Access Token 确定。

成功时返回分析对象：

```json
{
  "id": "1",
  "cropId": 1,
  "cropName": "小麦",
  "regionCode": "610116",
  "regionName": "陕西省西安市长安区",
  "status": "succeeded",
  "result": {
    "schemaVersion": "1.0",
    "overview": "……",
    "suitability": {
      "level": "medium",
      "score": 65,
      "reasons": ["……"]
    },
    "risks": [],
    "actions": [],
    "knowledgeReferences": [
      { "knowledgeId": 12, "version": 1, "title": "小麦：基础田间管理与风险提示" }
    ],
    "contextWarnings": ["实时天气未接入"],
    "disclaimer": "仅供农业管理参考。"
  },
  "schemaVersion": "1.0",
  "promptVersion": "m08-v1",
  "modelProvider": "openai-compatible",
  "modelName": "kimi-k2.6",
  "durationMs": 21000,
  "createdAt": "2026-08-25T00:00:00.000Z",
  "completedAt": "2026-08-25T00:00:21.000Z"
}
```

`id` 是字符串，前端不得按 JavaScript `number` 处理。`result` 为 `null` 时表示分析尚未成功生成；正常的同步创建成功响应为 `succeeded`。

### 3.5 查询本人分析列表

```http
GET /api/v2/agriculture/analyses?cropId=1&regionCode=610116&status=succeeded&page=1&pageSize=20
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `cropId` | number | 可选作物筛选 |
| `regionCode` | string | 可选地区筛选 |
| `status` | string | 可选状态：`processing`、`succeeded`、`failed` |

仅返回当前用户自己的记录。列表项字段与「创建农业分析」响应一致。

### 3.6 查询本人分析详情

```http
GET /api/v2/agriculture/analyses/:id
```

仅返回当前用户自己的记录。访问其他用户的分析也返回 `404`，前端不应据此区分「不存在」和「无权访问」。

## 4. 管理端 API

所有本节接口需要管理员 Access Token。`admin` 和 `super_admin` 均可维护作物及知识；仅 `super_admin` 可软删除知识。

### 4.1 作物目录

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v2/admin/agriculture/crops` | 查询全部作物，包含停用作物 |
| POST | `/api/v2/admin/agriculture/crops` | 新建作物 |
| PATCH | `/api/v2/admin/agriculture/crops/:id` | 修改作物名称、学名或状态 |
| POST | `/api/v2/admin/agriculture/crops/:id/aliases` | 新增别名 |
| DELETE | `/api/v2/admin/agriculture/crops/:id/aliases/:aliasId` | 删除别名 |

新建作物请求体：

```json
{
  "code": "wheat",
  "name": "小麦",
  "scientificName": "Triticum aestivum"
}
```

修改作物请求体仅传需要更新的字段：

```json
{
  "status": "inactive"
}
```

`status` 仅支持 `active` 或 `inactive`。别名新增请求体：

```json
{ "alias": "麦子" }
```

别名经标准化后全局唯一；重复时返回 `409`。作物停用后不出现在用户端作物列表，也不能创建新的分析。

### 4.2 农业知识维护

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v2/admin/agriculture/knowledge` | 分页查询全部未删除知识，包含草稿与归档内容 |
| POST | `/api/v2/admin/agriculture/knowledge` | 新建草稿 |
| GET | `/api/v2/admin/agriculture/knowledge/:id` | 查询后台知识详情 |
| PATCH | `/api/v2/admin/agriculture/knowledge/:id` | 修改草稿或已发布知识 |
| POST | `/api/v2/admin/agriculture/knowledge/:id/publish` | 发布草稿 |
| POST | `/api/v2/admin/agriculture/knowledge/:id/archive` | 归档已发布知识 |
| DELETE | `/api/v2/admin/agriculture/knowledge/:id` | 软删除，仅 `super_admin` |

新建或更新请求体：

```json
{
  "title": "小麦：基础田间管理与风险提示",
  "summary": "按苗情、墒情和目标产量实施测土配方与分期肥水管理。",
  "content": "正文内容……",
  "category": "种植管理",
  "tags": ["田间管理", "风险提示"],
  "regionCodes": ["610116"],
  "isGeneral": false,
  "sourceName": "来源机构或资料名称",
  "sourceUrl": "https://example.com/source",
  "validUntil": "2027-12-31",
  "cropIds": [1]
}
```

| 字段 | 必填 | 约束 |
| --- | --- | --- |
| `title` | 是 | 最长 255 字符 |
| `summary` | 否 | 最长 500 字符 |
| `content` | 是 | 最长 20,000 字符 |
| `category` | 是 | 最长 32 字符 |
| `tags` | 否 | 最多 20 项 |
| `regionCodes` | 否 | 最多 50 项；空数组表示不限制地区 |
| `isGeneral` | 否 | 是否为通用知识，默认 `false` |
| `sourceName` | 否 | 发布时必须提供，最长 255 字符 |
| `sourceUrl` | 否 | 需为合法 URL，最长 1,000 字符 |
| `validUntil` | 否 | `YYYY-MM-DD` |
| `cropIds` | 否 | 最多 20 个有效作物 ID |

发布前置条件：知识必须为草稿、已填写 `sourceName`，并且满足「至少关联一个作物」或 `isGeneral=true`。归档只允许对已发布知识执行。

## 5. 前端实现提示

- 用户端和管理端应分别保存并发送对应身份类型的 Access Token。
- 页面应以 `status` 驱动分析展示；`failed` 或 `result=null` 时展示通用失败提示，不展示内部错误信息。
- `knowledgeReferences` 是可追溯来源，可跳转至用户端知识详情页。
- 后台编辑已发布知识会递增 `version`；前端保存成功后应以接口返回值刷新表单与列表。
- 删除知识为软删除，成功后从后台列表移除即可。
- 当前知识分类没有后端枚举约束。前端可统一使用「种植管理」「病虫害」「土肥管理」「气象风险」「采收储存」等产品字典，但提交值最长为 32 字符。
