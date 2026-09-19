# 智乡云 V2 农业模块 API 设计基线 V1

> 项目：智乡云  
> 模块：农业  
> 文档性质：API 设计基线  
> 版本：V1  
> Base Path：`/api/agriculture`  
> API 风格：REST  
> 认证：JWT  
> 数据库：PostgreSQL  
> ORM：MikroORM  
> 数据校验：Zod  

---

# 1. 文档目标

本文档定义智乡云 V2 农业模块的 API 设计基线。Backend 完成并验证后，应根据实际行为生成同目录 `api-contract.md` 作为严格 API Contract；本文不替代该 Contract。

本设计基线服务以下当前业务：

- 地块档案；
- 种植档案；
- 作物信息；
- 农业知识；
- AI 种植评估；
- 作物生长指标；
- 生长趋势；
- AI 生长分析；
- AI 分析历史。

接口设计遵循：

```text
业务 API
≠
数据库字段直接暴露
≠
AI 内部 Context
≠
Prompt / Model Provider
```

前端只提交用户真正能够决定的数据。

数据库已有数据、天气、农业知识、生长趋势等系统上下文由后端自行读取和构建。

---

# 2. 全局约定

## 2.1 Base Path

```text
/api/agriculture
```

文档后续路径均省略该前缀。

---

## 2.2 用户身份

所有用户私有资源必须通过：

```text
JWT
↓
CurrentUser
```

确定用户身份。

客户端不得提交：

```text
userId
```

作为数据所有权依据。

禁止：

```http
GET /lands?userId=xxx
```

以及：

```json
{
  "userId": "xxx"
}
```

后端必须根据当前认证用户验证资源所有权。

---

## 2.3 越权资源

当请求的用户私有资源：

- 不存在；
- 或不属于当前用户；

统一按照：

```text
RESOURCE_NOT_FOUND
```

处理。

不得通过错误响应向客户端暴露：

> 某个资源真实存在，但属于其他用户。

---

## 2.4 时间格式

时间戳统一使用 ISO 8601：

```text
2026-09-19T08:30:00+08:00
```

纯日期使用：

```text
YYYY-MM-DD
```

例如：

```text
2026-04-10
```

---

## 2.5 分页

需要分页的列表接口使用：

```text
page
pageSize
```

建议默认：

```text
page = 1
pageSize = 20
```

建议最大：

```text
pageSize <= 50
```

分页数据统一表达为：

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

项目如已有统一响应包装：

```text
code
message
data
```

农业模块继续复用项目全局规范，不另造第二套顶层 Response Envelope。

本文档中的 JSON 默认表示 `data` 业务部分。

---

# 3. 全局错误语义

农业模块应复用项目统一异常过滤器。

领域错误建议至少定义：

| HTTP | Code | 含义 |
|---:|---|---|
| 400 | VALIDATION_ERROR | 请求参数不符合契约 |
| 401 | UNAUTHORIZED | 未认证或 Token 无效 |
| 404 | RESOURCE_NOT_FOUND | 资源不存在或无权访问 |
| 409 | LAND_HAS_HISTORY | 地块已有历史数据，不允许删除 |
| 409 | PLANTING_HAS_HISTORY | 种植档案已有历史数据，不允许删除 |
| 409 | METRIC_HAS_RECORDS | 指标已有记录，不允许删除 |
| 409 | INVALID_PLANTING_STATUS_TRANSITION | 非法种植状态转换 |
| 502 | AI_MODEL_REQUEST_FAILED | 模型调用失败 |
| 502 | AI_OUTPUT_INVALID | AI 结构化输出无效 |
| 503 | KNOWLEDGE_RETRIEVAL_FAILED | 农业知识检索发生技术失败 |
| 504 | AI_REQUEST_TIMEOUT | AI 请求超时 |

错误响应不得返回：

- Prompt；
- API Key；
- Access Token；
- Refresh Token；
- 第三方模型原始敏感错误；
- 用户完整农业档案；
- 内部 Stack Trace。

---

# 4. 地块 API

## 4.1 创建地块

```http
POST /lands
```

### Request

```json
{
  "name": "家后菜地",
  "region": {
    "province": "陕西省",
    "city": "西安市",
    "district": "长安区"
  },
  "plantingEnvironment": "open_field",
  "area": {
    "value": 0.5,
    "unit": "mu"
  },
  "soil": "偏黏",
  "irrigation": "方便",
  "drainage": "一般",
  "description": "连续降雨时容易积水"
}
```

### Required

```text
name
region.province
region.city
region.district
plantingEnvironment
```

`area`、`soil`、`irrigation`、`drainage`、`description` 均可选。

### Response

```json
{
  "id": "land_xxx",
  "name": "家后菜地",
  "region": {
    "province": "陕西省",
    "city": "西安市",
    "district": "长安区"
  },
  "plantingEnvironment": "open_field",
  "area": {
    "value": 0.5,
    "unit": "mu"
  },
  "soil": "偏黏",
  "irrigation": "方便",
  "drainage": "一般",
  "description": "连续降雨时容易积水",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 4.2 地块列表

```http
GET /lands
```

只返回当前认证用户自己的地块。

### Response

```json
[
  {
    "id": "land_xxx",
    "name": "家后菜地",
    "region": {
      "province": "陕西省",
      "city": "西安市",
      "district": "长安区"
    },
    "plantingEnvironment": "open_field",
    "createdAt": "..."
  }
]
```

---

## 4.3 地块详情

```http
GET /lands/:landId
```

返回完整 Land DTO。

---

## 4.4 修改地块

```http
PATCH /lands/:landId
```

只允许修改业务可编辑字段。

例如：

```json
{
  "drainage": "容易积水",
  "description": "连续降雨时排水较慢"
}
```

禁止通过 PATCH 修改：

```text
id
userId
createdAt
```

后端必须使用白名单 DTO / Zod Schema，避免 Mass Assignment。

---

## 4.5 删除地块

```http
DELETE /lands/:landId
```

只有不存在以下历史数据时允许删除：

- 种植档案；
- AI 种植评估历史。

存在历史数据时：

```text
409 LAND_HAS_HISTORY
```

核心历史数据禁止通过级联删除清空。

---

# 5. 作物 API

## 5.1 作物列表 / 搜索

```http
GET /crops
```

### Query

```text
keyword
page
pageSize
```

`keyword` 应同时匹配：

```text
standard_name
crop_aliases.alias
```

例如：

```http
GET /crops?keyword=西红柿&page=1&pageSize=20
```

### Response

```json
{
  "items": [
    {
      "id": "crop_tomato",
      "standardName": "番茄",
      "matchedName": "西红柿"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

如果通过标准名称命中：

```text
matchedName
```

可以等于 `standardName`。

---

## 5.2 作物详情

```http
GET /crops/:cropId
```

### Response

```json
{
  "id": "crop_tomato",
  "standardName": "番茄",
  "aliases": [
    "西红柿"
  ],
  "introduction": "...",
  "suitableEnvironment": "...",
  "growthStages": [
    "苗期",
    "开花期",
    "结果期",
    "成熟期"
  ],
  "managementNotes": "...",
  "commonPests": []
}
```

---

# 6. 农业知识 API

## 6.1 农业知识列表 / 搜索

```http
GET /knowledge
```

### Query

```text
keyword
cropId
category
page
pageSize
```

当前用户侧 API 不暴露地区检索参数。

地区关联主要由后端在 AI Context Builder 中用于自动检索。

### Example

```http
GET /knowledge?cropId=crop_tomato&category=water_fertilizer&page=1&pageSize=20
```

### Response

```json
{
  "items": [
    {
      "id": "knowledge_xxx",
      "title": "...",
      "category": "water_fertilizer",
      "source": {
        "name": "农业农村部"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

---

## 6.2 农业知识详情

```http
GET /knowledge/:knowledgeId
```

### Response

```json
{
  "id": "knowledge_xxx",
  "title": "...",
  "category": "water_fertilizer",
  "content": "...",
  "source": {
    "name": "农业农村部",
    "title": "...",
    "url": "..."
  },
  "relatedCrops": [
    {
      "id": "crop_tomato",
      "name": "番茄"
    }
  ]
}
```

---

# 7. AI 种植评估 API

AI 种植评估属于固定输入、固定输出的 Structured AI Analysis。

不得使用 Agent 执行该流程。

---

## 7.1 创建 AI 种植评估

```http
POST /lands/:landId/planting-evaluations
```

`landId` 使用路径参数，不在 Body 中重复提交。

---

## 7.2 Crop Input

为避免：

```text
cropId = 番茄
name = 黄瓜
```

这类客户端自相矛盾数据，Crop Input 使用 discriminated union。

### 系统已有作物

```json
{
  "crop": {
    "type": "catalog",
    "cropId": "crop_tomato",
    "variety": null
  },
  "plannedPlantingTime": "2027年春季"
}
```

### 用户自由输入作物

```json
{
  "crop": {
    "type": "manual",
    "name": "某地方甜瓜",
    "variety": null
  },
  "plannedPlantingTime": "2027年春季"
}
```

后端不得要求客户端同时提供：

```text
cropId + cropName
```

并自行判断谁可信。

---

## 7.3 后端执行流程

```text
CurrentUser
    ↓
landId
    ↓
验证 Land 所有权
    ↓
读取 Land
    ↓
解析 Crop
    ↓
根据 Crop + Region 等检索 Agriculture Knowledge
    ↓
Context Builder
    ↓
Prompt Builder
    ↓
Structured LLM
    ↓
Zod Validation
    ↓
Reference Validation
    ↓
保存历史
    ↓
返回结果
```

前端不得提交：

- soil；
- irrigation；
- drainage；
- knowledgeContext；
- AI Input Snapshot；
- references。

这些数据全部由后端构建。

---

## 7.4 AI Reference Validation

模型不得被允许自由生成可信知识来源。

推荐模型结构化输出中：

```text
references
```

只返回：

```text
knowledgeId
```

或知识 Context 中的受控引用 ID。

后端必须验证：

```text
AI 返回的 knowledgeId
⊆
本次实际检索出的 knowledgeId 集合
```

验证通过后，再由数据库补充：

```text
title
source
```

最终对外返回：

```json
{
  "knowledgeId": "knowledge_xxx",
  "title": "...",
  "source": "农业农村部"
}
```

如果 AI 引用了本次 Context 中不存在的知识：

```text
502 AI_OUTPUT_INVALID
```

不得把模型编造的来源直接保存为可信历史。

---

## 7.5 Response

```json
{
  "id": "evaluation_xxx",
  "context": {
    "land": {
      "id": "land_xxx",
      "name": "家后菜地",
      "region": {
        "province": "陕西省",
        "city": "西安市",
        "district": "长安区"
      },
      "plantingEnvironment": "open_field",
      "soil": "偏黏",
      "irrigation": "方便",
      "drainage": "一般"
    },
    "crop": {
      "id": "crop_tomato",
      "inputName": "西红柿",
      "standardName": "番茄",
      "variety": null
    },
    "plannedPlantingTime": "2027年春季"
  },
  "result": {
    "summary": "该地块具备番茄露地种植的基本条件，但排水条件需要重点关注。",
    "suitability": "suitable_with_conditions",
    "advantages": [],
    "limitations": [],
    "plantingSuggestions": [],
    "preparations": [],
    "attentionPoints": [],
    "references": []
  },
  "createdAt": "..."
}
```

对于 manual crop：

```text
context.crop.id
context.crop.standardName
```

允许为 `null`。

---

## 7.6 地块的种植评估历史

```http
GET /lands/:landId/planting-evaluations
```

### Query

```text
page
pageSize
```

### Response

列表只返回轻量字段：

```json
{
  "items": [
    {
      "id": "evaluation_xxx",
      "crop": {
        "name": "番茄"
      },
      "summary": "...",
      "suitability": "suitable_with_conditions",
      "createdAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

---

## 7.7 种植评估详情

```http
GET /planting-evaluations/:evaluationId
```

历史详情中的：

```text
land
crop
plannedPlantingTime
result
```

必须来自该历史记录保存的 Snapshot。

禁止：

```text
查询当前 Land
+
查询当前 Crop
+
重新拼成历史详情
```

否则地块后续修改后，会污染历史展示。

当前实体 ID 可以用于导航，但历史内容必须以分析发生时的 Snapshot 为准。

---

# 8. 种植档案 API

## 8.1 创建种植档案

```http
POST /lands/:landId/plantings
```

### Request

```json
{
  "cropId": "crop_tomato",
  "variety": "某品种",
  "plantingTime": {
    "type": "date",
    "date": "2026-04-10"
  },
  "growthStage": null,
  "status": "growing",
  "description": null
}
```

`cropId` 必须指向系统标准作物。

---

## 8.2 plantingTime

使用 discriminated union。

### 精确日期

```json
{
  "type": "date",
  "date": "2026-04-10"
}
```

### 模糊时间

```json
{
  "type": "text",
  "text": "2026年春季"
}
```

### 未知

```json
null
```

API 不直接暴露数据库中的：

```text
planting_date
planting_time_text
```

XOR 实现细节。

---

## 8.3 创建时 status

创建时允许：

```text
planned
growing
```

不允许直接创建为：

```text
harvested
ended
```

---

## 8.4 种植档案列表

```http
GET /plantings
```

### Query

```text
landId
cropId
status
page
pageSize
```

### Default Sort

```text
createdAt DESC
```

---

## 8.5 种植档案详情

```http
GET /plantings/:plantingId
```

---

## 8.6 修改种植档案

```http
PATCH /plantings/:plantingId
```

当前允许修改：

- variety；
- plantingTime；
- growthStage；
- status；
- description。

当前不允许修改：

- landId；
- cropId；
- id；
- createdAt。

避免已经产生生长数据后改变该批数据实际所属作物或地块。

---

## 8.7 种植状态转换

允许：

```text
planned
  ├── growing
  └── ended

growing
  ├── harvested
  └── ended

harvested
  └── ended

ended
  └── 不允许恢复
```

非法转换：

```text
409 INVALID_PLANTING_STATUS_TRANSITION
```

---

## 8.8 删除种植档案

```http
DELETE /plantings/:plantingId
```

仅用于删除误创建、且尚未形成业务历史的种植档案。

如果已经存在：

- 生长指标；
- AI 生长分析；

返回：

```text
409 PLANTING_HAS_HISTORY
```

已有真实种植历史时，应使用：

```text
harvested
ended
```

结束生命周期，而不是删除。

---

# 9. 生长指标 API

## 9.1 创建指标

```http
POST /plantings/:plantingId/metrics
```

### Request

```json
{
  "name": "植株高度",
  "unit": "cm"
}
```

同一次 planting 内：

```text
name
```

不得重复。

---

## 9.2 指标列表

```http
GET /plantings/:plantingId/metrics
```

### Response

```json
[
  {
    "id": "metric_xxx",
    "name": "植株高度",
    "unit": "cm",
    "latestValue": 82,
    "latestRecordedAt": "...",
    "recordCount": 12
  }
]
```

---

## 9.3 删除空指标

```http
DELETE /metrics/:metricId
```

只有：

```text
recordCount = 0
```

时允许删除。

如果已经存在记录：

```text
409 METRIC_HAS_RECORDS
```

当前 V1 不提供修改指标单位的接口，避免已有历史值因单位修改而产生语义污染。

---

# 10. 生长指标记录 API

## 10.1 添加记录

```http
POST /metrics/:metricId/records
```

### Request

```json
{
  "value": 82,
  "recordedAt": "2026-09-19T08:30:00+08:00",
  "note": null
}
```

---

## 10.2 查询记录

```http
GET /metrics/:metricId/records
```

### Query

```text
from
to
page
pageSize
```

### Default Sort

```text
recordedAt DESC
```

---

## 10.3 删除错误记录

```http
DELETE /metrics/:metricId/records/:recordId
```

只删除当前 metric 下的指定 record。

后端必须同时验证：

```text
record.metricId === metricId
```

以及该 metric 最终属于当前用户。

当前 V1 不提供 Record 修改接口。

错误数据采用：

```text
删除
+
重新创建
```

处理。

---

# 11. 生长趋势 API

## 11.1 获取趋势

```http
GET /metrics/:metricId/trend
```

### Query

```text
from
to
limit
```

### Response

```json
{
  "metric": {
    "id": "metric_xxx",
    "name": "植株高度",
    "unit": "cm"
  },
  "latestValue": 82,
  "trend": "increasing",
  "change": 12,
  "averageChange": 2.4,
  "points": [
    {
      "value": 70,
      "recordedAt": "..."
    },
    {
      "value": 75,
      "recordedAt": "..."
    },
    {
      "value": 82,
      "recordedAt": "..."
    }
  ]
}
```

---

## 11.2 趋势计算原则

以下内容必须由普通 TypeScript 确定性计算：

```text
latestValue
change
averageChange
trend
```

LLM 不参与基础趋势计算。

当前建议 trend：

```text
increasing
stable
decreasing
insufficient_data
```

具体稳定阈值属于后端确定性算法实现，应统一定义，不允许由模型判断。

---

# 12. AI 生长分析 API

AI 生长分析是 Structured AI Analysis，不使用 Agent。

---

## 12.1 创建 AI 生长分析

```http
POST /plantings/:plantingId/growth-analyses
```

### Request

```json
{
  "observations": [
    "叶片发黄",
    "土壤过湿"
  ],
  "description": "最近连续下雨，下面几片叶子开始发黄。",
  "growthStage": "结果期"
}
```

其中：

```text
observations
description
```

至少一项存在且有有效内容。

---

## 12.2 growthStage

`growthStage` 为可选的本次分析覆盖值。

规则：

```text
请求提供 growthStage
→ 本次分析使用请求值

请求未提供 growthStage
→ 使用 Planting 当前 growthStage
```

请求中的 `growthStage`：

- 只用于本次分析；
- 保存到本次历史 Snapshot；
- 不自动修改 Planting 档案。

如果用户希望永久更新种植阶段，应调用：

```http
PATCH /plantings/:plantingId
```

---

# 13. AI 生长分析 Context

前端不得提交：

- crop；
- land；
- region；
- plantingEnvironment；
- weather；
- growthMetrics；
- knowledgeContext；
- references。

后端执行：

```text
plantingId
    ↓
验证 CurrentUser
    ↓
读取 Planting
    ↓
读取 Land
    ↓
读取 Crop
    ↓
读取 Growth Metrics
    ↓
确定性计算 Growth Trend
    ↓
获取 Weather
    ↓
检索 Agriculture Knowledge
    ↓
Context Builder
    ↓
Structured AI
```

数据库和外部服务已有的数据不要求用户重复填写。

---

# 14. Weather Unavailable 降级策略

天气不可用不等于整个 AI 生长分析必须失败。

当 WeatherService 无法获取真实天气时：

```text
Weather = Unavailable
```

Context Builder 必须明确向模型提供：

```text
天气数据不可用
```

不得模拟天气。

生长分析可以继续基于：

- Planting；
- Land；
- User Observation；
- Growth Metrics；
- Agriculture Knowledge；

进行分析。

Response 增加：

```json
{
  "warnings": [
    "WEATHER_UNAVAILABLE"
  ]
}
```

前端可据此提示：

> 本次分析未能获取实时天气，结论未纳入天气因素。

---

# 15. Knowledge Retrieval Failure

必须区分：

## 15.1 没有匹配知识

```text
检索成功
+
结果为空
```

属于合法情况。

可以继续分析，但：

```text
references
```

可能为空。

---

## 15.2 知识检索技术失败

例如：

- Database Query Failed；
- Knowledge Service Error。

此时：

```text
503 KNOWLEDGE_RETRIEVAL_FAILED
```

不继续生成依赖可信知识来源的正式 AI 分析结果。

---

# 16. AI 生长分析 Response

```json
{
  "id": "analysis_xxx",
  "context": {
    "planting": {
      "id": "planting_xxx",
      "crop": {
        "id": "crop_tomato",
        "name": "番茄",
        "variety": null
      },
      "plantingDate": "2026-04-10",
      "growthStage": "结果期"
    },
    "land": {
      "id": "land_xxx",
      "name": "家后菜地",
      "region": {
        "province": "陕西省",
        "city": "西安市",
        "district": "长安区"
      },
      "plantingEnvironment": "open_field"
    },
    "observations": [
      "叶片发黄",
      "土壤过湿"
    ],
    "description": "最近连续下雨，下面几片叶子开始发黄。"
  },
  "result": {
    "summary": "当前番茄处于结果期……",
    "growthStatus": "needs_attention",
    "currentSituation": [],
    "concerns": [],
    "possibleFactors": [],
    "managementSuggestions": [],
    "followUp": [],
    "references": []
  },
  "warnings": [],
  "createdAt": "..."
}
```

---

# 17. AI 生长分析历史

## 17.1 某次种植的分析历史

```http
GET /plantings/:plantingId/growth-analyses
```

### Query

```text
page
pageSize
```

### Response

```json
{
  "items": [
    {
      "id": "analysis_xxx",
      "summary": "...",
      "growthStatus": "needs_attention",
      "createdAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

---

## 17.2 分析详情

```http
GET /growth-analyses/:analysisId
```

历史详情中的：

- crop；
- variety；
- growthStage；
- land；
- region；
- observations；
- description；
- weather 状态；
- growth metric summary；
- AI result；
- references；

必须来自本次分析保存的历史 Snapshot。

禁止读取当前 Planting / Land 后重新构造历史 Context。

---

# 18. AI Snapshot 与 API DTO

数据库内部可以保存：

```text
input_snapshot
result_snapshot
schema_version
```

API 不直接暴露这些数据库字段名。

后端需要：

```text
Snapshot
↓
Schema Version Adapter
↓
Stable API DTO
```

因此客户端看到：

```text
context
result
warnings
```

而不是：

```text
input_snapshot
result_snapshot
schema_version
```

数据库历史结构变化不应直接破坏前端 API。

---

# 19. AI Result 保存原则

AI 输出统一执行：

```text
LLM
 ↓
Structured Output
 ↓
Zod Validation
 ↓
Reference Validation
 ↓
ValidatedResult
 ↓
Database Transaction
```

数据库普通字段和 JSON Snapshot 必须来源于同一个 `ValidatedResult`。

例如：

```text
ValidatedResult.summary
    ├── summary column
    └── result_snapshot.summary

ValidatedResult.growthStatus
    ├── growth_status column
    └── result_snapshot.growthStatus
```

禁止两套逻辑分别写入，避免数据不一致。

---

# 20. 最终接口清单

统一前缀：

```text
/api/agriculture
```

| # | Method | Path | 作用 |
|---:|---|---|---|
| 1 | POST | `/lands` | 创建地块 |
| 2 | GET | `/lands` | 地块列表 |
| 3 | GET | `/lands/:landId` | 地块详情 |
| 4 | PATCH | `/lands/:landId` | 修改地块 |
| 5 | DELETE | `/lands/:landId` | 删除无历史地块 |
| 6 | GET | `/crops` | 作物浏览 / 搜索 |
| 7 | GET | `/crops/:cropId` | 作物详情 |
| 8 | GET | `/knowledge` | 农业知识搜索 / 筛选 |
| 9 | GET | `/knowledge/:knowledgeId` | 农业知识详情 |
| 10 | POST | `/lands/:landId/planting-evaluations` | AI 种植评估 |
| 11 | GET | `/lands/:landId/planting-evaluations` | 地块评估历史 |
| 12 | GET | `/planting-evaluations/:evaluationId` | 评估详情 |
| 13 | POST | `/lands/:landId/plantings` | 创建种植档案 |
| 14 | GET | `/plantings` | 种植档案列表 |
| 15 | GET | `/plantings/:plantingId` | 种植档案详情 |
| 16 | PATCH | `/plantings/:plantingId` | 修改种植档案 |
| 17 | DELETE | `/plantings/:plantingId` | 删除无历史种植档案 |
| 18 | POST | `/plantings/:plantingId/metrics` | 创建生长指标 |
| 19 | GET | `/plantings/:plantingId/metrics` | 指标列表 |
| 20 | DELETE | `/metrics/:metricId` | 删除无记录指标 |
| 21 | POST | `/metrics/:metricId/records` | 添加指标记录 |
| 22 | GET | `/metrics/:metricId/records` | 查询指标历史 |
| 23 | DELETE | `/metrics/:metricId/records/:recordId` | 删除错误记录 |
| 24 | GET | `/metrics/:metricId/trend` | 获取生长趋势 |
| 25 | POST | `/plantings/:plantingId/growth-analyses` | AI 生长分析 |
| 26 | GET | `/plantings/:plantingId/growth-analyses` | 生长分析历史 |
| 27 | GET | `/growth-analyses/:analysisId` | 生长分析详情 |

当前 V1 共：

```text
27 个农业业务接口
```

---

# 21. 当前不暴露的 API

当前不设计：

```text
/agriculture/weather
/agriculture/context
/agriculture/prompts
/agriculture/models
/agriculture/ai-tools
/agriculture/yield-predictions
/agriculture/harvest-predictions
/agriculture/disease-diagnosis
/agriculture/iot
```

原因：

- Weather 属于后端内部基础能力；
- Context Builder / Prompt Builder 属于内部实现；
- Model Provider 属于 AI 技术层；
- 预测、病害识别、IoT 当前不属于 V2 农业业务范围。

---

# 22. V1 冻结原则

农业接口 V1 以以下规则作为契约基线：

1. 用户身份只来自认证上下文，不接受客户端任意 `userId`。
2. API 表达业务对象，不直接暴露数据库字段结构。
3. Land / Planting / Metric 等资源所有权必须逐级验证。
4. AI Context 由后端构建，不信任前端提交系统已有数据。
5. AI 种植评估和 AI 生长分析都使用 Structured AI，不使用 Agent。
6. AI 输出先经过 Zod，再进行知识引用真实性校验。
7. AI 历史详情从 Snapshot 还原，不重新读取当前档案冒充历史。
8. Weather 不可用允许降级，但必须明确告知。
9. Knowledge Retrieval 技术失败不能伪装成“没有相关知识”。
10. 历史业务数据默认不级联删除。
11. Planting 生命周期优先通过状态结束，而不是删除。
12. 生长趋势由 TypeScript 确定性计算。
13. AI 输入 / 输出 JSONB 是数据库内部实现，前端只依赖稳定 DTO。
14. 当前只实现需求范围内能力，不提前暴露未来接口。

本版本可作为：

```text
前端实现
+
NestJS Controller / DTO
+
Zod Schema
+
Service
+
MikroORM Entity
+
AI Context Builder
```

之间的农业模块正式接口基线。
