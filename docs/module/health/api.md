# 新健康业务接口文档

> 项目：智乡云 V2  
> 模块：健康  
> 文档性质：REST API 设计基线  
> 后端：NestJS + TypeScript  
> 数据校验：Zod  
> 认证：JWT  
> API 风格：REST  
> 项目级别：Competition / Demo  
> 状态：当前版本冻结

---

# 1. 文档目标

本文档用于定义智乡云 V2 健康模块用户侧 REST API。

覆盖业务：

1. 健康档案；
2. 健康指标记录；
3. 健康指标趋势；
4. 自定义健康指标模板；
5. AI 健康分析；
6. AI 健康分析历史；
7. 健康知识浏览与搜索。

当前不在本文档中定义管理员健康知识 CRUD。

---

# 2. API 总体原则

## 2.1 当前用户作为唯一身份来源

所有私人健康数据必须基于：

```text
JWT
↓
JwtGuard
↓
Current User
↓
user.id
```

客户端不得传入任意：

```text
userId
```

读取其他用户健康数据。

---

## 2.2 API Base Path

```text
/api/health
```

主要资源：

```text
/api/health/profile

/api/health/metrics

/api/health/metric-templates

/api/health/analyses

/api/health/knowledge
```

健康模块资源 ID 使用正整数；客户端传入资源 ID 时必须作为整数处理。

---

## 2.3 输入校验

所有请求参数使用：

```text
Zod
```

进行校验。

特别是健康指标写入，应使用：

```text
discriminated union
```

避免产生非法字段组合。

---

## 2.4 不直接暴露数据库 Entity

Controller 不直接返回 MikroORM Entity。

推荐：

```text
Entity
↓
Service
↓
Response Mapper / DTO
↓
API Response
```

特别是 AI 分析历史，数据库内部：

```text
input_snapshot
context_snapshot
result_snapshot
```

不应直接等同于外部 API 契约。

---

# 3. 当前接口总览

```text
Health Profile
────────────────────────────────
GET    /api/health/profile
PUT    /api/health/profile


Health Metrics
────────────────────────────────
GET    /api/health/metrics
POST   /api/health/metrics
DELETE /api/health/metrics/:id

GET    /api/health/metrics/trend


Custom Metric Templates
────────────────────────────────
GET    /api/health/metric-templates
POST   /api/health/metric-templates

GET    /api/health/metric-templates/:id
PATCH  /api/health/metric-templates/:id


AI Health Analysis
────────────────────────────────
POST   /api/health/analyses

GET    /api/health/analyses
GET    /api/health/analyses/:id


Health Knowledge
────────────────────────────────
GET    /api/health/knowledge
GET    /api/health/knowledge/:id
```

共 14 个 Endpoint。

---

# 4. 健康档案

## 4.1 获取当前用户健康档案

```http
GET /api/health/profile
```

用途：

> 获取当前认证用户的健康档案。

### Response

```json
{
  "id": 1,
  "sex": "male",
  "birthDate": "2006-07-09",
  "heightCm": 175,
  "smokingStatus": "never",
  "drinkingStatus": "occasional",
  "exerciseStatus": "moderate",
  "sleepStatus": "average",
  "healthHistory": null,
  "allergies": null,
  "createdAt": "2026-09-13T20:00:00+08:00",
  "updatedAt": "2026-09-13T20:00:00+08:00"
}
```

如果当前用户尚未创建档案，可由实现统一决定返回：

```text
null
```

或标准业务空结果。

---

# 5. 创建 / 更新健康档案

```http
PUT /api/health/profile
```

选择 `PUT` 的原因：

> 当前健康档案是已知 URI 下的单例资源。

第一次调用可以创建档案，之后调用用于更新。

前端保存时提交完整当前表单状态。

### Request

```json
{
  "sex": "male",
  "birthDate": "2006-07-09",
  "heightCm": 175,
  "smokingStatus": "never",
  "drinkingStatus": "occasional",
  "exerciseStatus": "moderate",
  "sleepStatus": "average",
  "healthHistory": null,
  "allergies": null
}
```

所有业务字段允许按需求定义为可选 / nullable。

健康档案不完整时，不应阻止用户使用 AI 健康分析。

---

# 6. 健康指标

健康指标统一通过：

```text
/api/health/metrics
```

管理。

不为：

```text
体重
血压
心率
体温
```

分别创建独立 API。

---

# 7. 新增健康指标

```http
POST /api/health/metrics
```

根据 `metricType` 使用不同请求结构。

---

# 8. 新增体重

### Request

```json
{
  "metricType": "weight",
  "value": 65.2,
  "measuredAt": "2026-09-13T20:30:00+08:00"
}
```

后端自动确定：

```text
unit = kg
```

---

# 9. 新增体温

### Request

```json
{
  "metricType": "temperature",
  "value": 38.5,
  "measuredAt": "2026-09-13T20:30:00+08:00"
}
```

后端自动确定：

```text
unit = ℃
```

---

# 10. 新增心率

### Request

```json
{
  "metricType": "heart_rate",
  "value": 78,
  "measuredAt": "2026-09-13T20:30:00+08:00"
}
```

后端自动确定：

```text
unit = bpm
```

---

# 11. 新增血压

### Request

```json
{
  "metricType": "blood_pressure",
  "systolic": 128,
  "diastolic": 82,
  "measuredAt": "2026-09-13T20:30:00+08:00"
}
```

后端自动确定：

```text
unit = mmHg
```

客户端不提交：

```text
value
unit
```

---

# 12. 新增自定义指标

```json
{
  "metricType": "custom",
  "templateId": 1,
  "value": 38.5,
  "measuredAt": "2026-09-13T20:30:00+08:00"
}
```

后端根据：

```text
templateId
```

读取：

```text
health_metric_templates.unit
```

并写入指标记录单位快照。

---

# 13. 指标请求校验

推荐 Zod 使用 discriminated union。

逻辑规则：

```text
weight
heart_rate
temperature
custom
    ↓
必须 value
```

```text
blood_pressure
    ↓
必须 systolic + diastolic
```

```text
custom
    ↓
必须 templateId
```

```text
系统预置指标
    ↓
禁止 templateId
```

客户端不得提交单位。

---

# 14. 获取健康指标历史

```http
GET /api/health/metrics
```

用途：

- 获取最近指标记录；
- 获取指定系统指标历史；
- 获取指定自定义模板历史；
- 按时间范围查询；
- 分页。

---

## Query

可支持：

```text
metricType
templateId
from
to
page
pageSize
```

例如：

```http
GET /api/health/metrics?metricType=temperature
```

```http
GET /api/health/metrics?templateId=xxx
```

```http
GET /api/health/metrics?page=1&pageSize=20
```

---

## Response

示例：

```json
{
  "items": [
    {
      "id": 1,
      "metricType": "temperature",
      "value": 38.5,
      "unit": "℃",
      "measuredAt": "2026-09-13T20:30:00+08:00",
      "createdAt": "2026-09-13T20:31:00+08:00"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

血压记录：

```json
{
  "id": 1,
  "metricType": "blood_pressure",
  "systolic": 128,
  "diastolic": 82,
  "unit": "mmHg",
  "measuredAt": "2026-09-13T20:30:00+08:00",
  "createdAt": "2026-09-13T20:31:00+08:00"
}
```

---

# 15. 删除错误指标记录

```http
DELETE /api/health/metrics/:id
```

当前业务只要求：

> 删除错误记录。

V2 当前不提供：

```text
PUT /metrics/:id

PATCH /metrics/:id
```

用户填写错误时：

```text
删除
↓
重新记录
```

即可。

删除时必须验证：

> 该记录属于当前认证用户。

---

# 16. 健康指标趋势

```http
GET /api/health/metrics/trend
```

用于：

- 趋势图；
- 简单确定性统计；
- AI 健康分析的趋势上下文。

---

# 17. 趋势查询目标

系统指标通过：

```text
metricType
```

查询。

允许：

```text
weight
blood_pressure
heart_rate
temperature
```

例如：

```http
GET /api/health/metrics/trend?metricType=weight
```

自定义指标通过：

```text
templateId
```

查询。

例如：

```http
GET /api/health/metrics/trend?templateId=1
```

不允许：

```http
GET /api/health/metrics/trend?metricType=custom
```

原因：

> 不同自定义模板可能具有完全不同的语义和单位，不能聚合为同一条趋势。

---

# 18. 趋势时间范围

可支持：

```text
from
to
```

例如：

```http
GET /api/health/metrics/trend?metricType=weight&from=2026-08-01&to=2026-09-13
```

---

# 19. 单值指标趋势 Response

适用于：

```text
weight
heart_rate
temperature
custom template
```

示例：

```json
{
  "target": {
    "type": "weight",
    "unit": "kg"
  },
  "points": [
    {
      "measuredAt": "2026-09-01T08:00:00+08:00",
      "value": 65.1
    },
    {
      "measuredAt": "2026-09-08T08:00:00+08:00",
      "value": 65.8
    }
  ],
  "statistics": {
    "latest": 65.8,
    "average": 65.45,
    "min": 65.1,
    "max": 65.8,
    "change": 0.7,
    "trend": "up"
  }
}
```

---

# 20. 血压趋势 Response

血压使用双序列。

```json
{
  "target": {
    "type": "blood_pressure",
    "unit": "mmHg"
  },
  "points": [
    {
      "measuredAt": "2026-09-01T08:00:00+08:00",
      "systolic": 125,
      "diastolic": 80
    },
    {
      "measuredAt": "2026-09-08T08:00:00+08:00",
      "systolic": 130,
      "diastolic": 84
    }
  ],
  "statistics": {
    "systolic": {
      "latest": 130,
      "average": 127.5,
      "min": 125,
      "max": 130,
      "change": 5,
      "trend": "up"
    },
    "diastolic": {
      "latest": 84,
      "average": 82,
      "min": 80,
      "max": 84,
      "change": 4,
      "trend": "up"
    }
  }
}
```

趋势和统计全部由 TypeScript 普通代码计算。

---

# 21. 自定义健康指标模板

路径：

```text
/api/health/metric-templates
```

---

# 22. 获取模板列表

```http
GET /api/health/metric-templates
```

可用于：

- 展示正在跟踪的模板；
- 展示历史模板；
- 前端选择模板。

可选查询参数：

```text
active
page
pageSize
```

例如：

```http
GET /api/health/metric-templates?active=true
```

其中：

```text
active = true
```

可理解为：

```text
endedAt IS NULL
```

---

# 23. 创建自定义模板

```http
POST /api/health/metric-templates
```

### Request

```json
{
  "name": "发烧期间体温",
  "metricName": "体温",
  "unit": "℃",
  "relatedSystemMetricType": "temperature",
  "startedAt": "2026-09-13T20:00:00+08:00"
}
```

`relatedSystemMetricType` 允许为空。

---

# 24. 获取模板详情

```http
GET /api/health/metric-templates/:id
```

必须验证：

> 模板属于当前认证用户。

可返回模板本身的信息。

当前不要求该接口自动返回完整指标记录。

指标记录仍统一通过：

```text
GET /api/health/metrics?templateId=xxx
```

获取。

---

# 25. 修改 / 结束模板

```http
PATCH /api/health/metric-templates/:id
```

例如修改模板名称：

```json
{
  "name": "发烧期间每日体温"
}
```

结束阶段性跟踪：

```json
{
  "endedAt": "2026-09-15T18:00:00+08:00"
}
```

当前不提供：

```text
DELETE /api/health/metric-templates/:id
```

原因：

> 自定义模板可能已经存在历史指标记录，物理删除会破坏历史数据关系。

---

# 26. AI 健康分析

路径：

```text
/api/health/analyses
```

AI 健康分析是固定结构化业务流程。

不是 Agent。

内部流程：

```text
用户输入
↓
Zod
↓
Current User
↓
健康档案
↓
近期健康指标
↓
确定性统计
↓
相关健康知识
↓
Health Context Builder
↓
Prompt Builder
↓
LLM
↓
Structured Output
↓
Zod Validation
↓
保存 Analysis
↓
返回结果
```

---

# 27. 发起 AI 健康分析

```http
POST /api/health/analyses
```

客户端只提交：

> 这一次发生了什么。

### Request

```json
{
  "symptoms": [
    "dizziness",
    "fatigue"
  ],
  "severity": "moderate",
  "duration": "1_3_days",
  "description": "最近几天晚上睡得比较晚，昨天出现头晕。"
}
```

客户端不提交：

```text
年龄
身高
体重
BMI
血压
既往健康情况
过敏情况
```

这些由服务器根据当前认证用户自动读取或计算。

---

# 28. AI 健康分析输出

成功时返回结构化业务结果。

示例：

```json
{
  "id": 1,
  "summary": "你近期存在头晕和乏力……",
  "concerns": [
    "近期睡眠时间偏少"
  ],
  "factors": [
    "近期作息不规律可能与当前不适有关"
  ],
  "suggestions": [
    "保持规律作息",
    "适当休息并继续观察症状变化"
  ],
  "medicalAdvice": "如果症状持续加重或出现明显异常，应考虑及时就医。",
  "references": [
    {
      "knowledgeId": 1,
      "title": "如何改善睡眠",
      "source": "某权威机构"
    }
  ],
  "createdAt": "2026-09-13T21:00:00+08:00"
}
```

---

# 29. AI 分析失败

以下情况必须返回明确失败：

```text
Model Request Failed

Structured Output Invalid

Knowledge Retrieval Failed
```

不得把：

```text
失败 / Unknown
```

解释成：

```text
正常 / 风险较低
```

当前成功完整生成分析后再写入：

```text
health_analyses
```

失败请求不保存为正常健康分析历史。

---

# 30. 获取 AI 分析历史列表

```http
GET /api/health/analyses
```

Query：

```text
page
pageSize
```

### Response

```json
{
  "items": [
    {
      "id": 1,
      "symptoms": [
        "dizziness",
        "fatigue"
      ],
      "severity": "moderate",
      "summary": "近期存在头晕和乏力……",
      "createdAt": "2026-09-13T21:00:00+08:00"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

列表接口只返回摘要信息。

不返回全部：

```text
context
statistics
references
完整 AI Result
```

---

# 31. 获取 AI 分析详情

```http
GET /api/health/analyses/:id
```

返回稳定业务 DTO。

示例：

```json
{
  "id": 1,
  "input": {
    "symptoms": [
      "dizziness",
      "fatigue"
    ],
    "severity": "moderate",
    "duration": "1_3_days",
    "description": "最近几天晚上睡得比较晚，昨天出现头晕。"
  },
  "context": {
    "profile": {
      "age": 20,
      "sex": "male",
      "heightCm": 175
    },
    "recentMetrics": {
      "weight": {
        "value": 65.2,
        "unit": "kg"
      }
    },
    "statistics": {
      "bmi": 21.29
    },
    "relatedTracking": []
  },
  "result": {
    "summary": "……",
    "concerns": [],
    "factors": [],
    "suggestions": [],
    "medicalAdvice": "……",
    "references": []
  },
  "createdAt": "2026-09-13T21:00:00+08:00"
}
```

底层数据可以来自：

```text
input_snapshot
context_snapshot
result_snapshot
```

但 API 不直接暴露数据库内部 JSONB 结构。

---

# 32. 健康知识

用户侧只提供：

```text
浏览
搜索
查看详情
```

路径：

```text
/api/health/knowledge
```

---

# 33. 浏览 / 搜索健康知识

```http
GET /api/health/knowledge
```

可支持：

```text
q
category
page
pageSize
```

例如：

```http
GET /api/health/knowledge?q=血压&category=health_metric&page=1&pageSize=20
```

接口同时承担：

```text
浏览
+
搜索
+
分类筛选
```

当前不建立：

```text
/knowledge/search

/knowledge/browse
```

等重复接口。

---

# 34. 知识列表 Response

```json
{
  "items": [
    {
      "id": 1,
      "title": "如何正确测量血压",
      "summary": "……",
      "category": "health_metric",
      "tags": [
        "血压",
        "测量"
      ],
      "sourceName": "某权威机构"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

只返回：

```text
isPublished = true
```

的知识。

---

# 35. 获取健康知识详情

```http
GET /api/health/knowledge/:id
```

### Response

```json
{
  "id": 1,
  "title": "如何正确测量血压",
  "summary": "……",
  "content": "……",
  "category": "health_metric",
  "tags": [
    "血压",
    "测量"
  ],
  "source": {
    "name": "某权威机构",
    "url": "https://..."
  },
  "createdAt": "2026-09-01T10:00:00+08:00",
  "updatedAt": "2026-09-01T10:00:00+08:00"
}
```

---

# 36. 当前不设计的接口

V2 当前不增加：

```text
GET /health/bmi

GET /health/statistics

GET /health/dashboard

GET /health/overview

GET /health/weight/history

GET /health/temperature/history

GET /health/blood-pressure/history

POST /metric-templates/:id/records

DELETE /metric-templates/:id
```

原因：

- BMI / Statistics 是派生结果；
- Dashboard / Overview 取决于后续前端页面设计；
- 指标历史统一由 `/metrics` 提供；
- 自定义指标记录统一走 `/metrics`；
- 模板删除可能破坏历史关系。

---

# 37. 当前不在本文档定义的管理员接口

管理员健康知识 CRUD 当前不纳入用户侧健康 API 基线。

例如：

```text
POST   /api/admin/health/knowledge
PATCH  /api/admin/health/knowledge/:id
DELETE /api/admin/health/knowledge/:id
```

后续应在管理员模块接口设计中单独定义。

---

# 38. 推荐 NestJS Controller 划分

```text
HealthProfileController

HealthMetricController

HealthMetricTemplateController

HealthAnalysisController

HealthKnowledgeController
```

职责对应：

```text
/profile

/metrics

/metric-templates

/analyses

/knowledge
```

---

# 39. API 与数据库映射

```text
GET / PUT
/health/profile
      ↓
health_profiles
```

```text
GET / POST / DELETE
/health/metrics
      ↓
health_metric_records
```

```text
GET / PATCH / POST
/health/metric-templates
      ↓
health_metric_templates
```

```text
POST / GET
/health/analyses
      ↓
health_analyses
```

```text
GET
/health/knowledge
      ↓
health_knowledge
```

---

# 40. 健康指标写入逻辑

```text
POST /metrics
      ↓
Zod
      ↓
Current User
      ↓
判断 metricType
      ↓
系统指标
│     └── 后端确定单位
│
└── custom
      ↓
   templateId
      ↓
验证模板属于当前用户
      ↓
读取模板单位
      ↓
写入 health_metric_records
```

---

# 41. 趋势查询逻辑

```text
GET /metrics/trend
      ↓
metricType OR templateId
      ↓
读取 health_metric_records
      ↓
TypeScript Statistics
      ↓
points
+
statistics
      ↓
Response
```

当前不由 LLM 计算趋势。

---

# 42. AI 分析数据流

```text
POST /analyses
      ↓
用户只提交本次症状
      ↓
Current User
      ↓
Health Profile
      ↓
Health Metrics
      ↓
Metric Statistics
      ↓
Health Knowledge
      ↓
Context Builder
      ↓
Prompt Builder
      ↓
LLM Provider
      ↓
Structured Output
      ↓
Zod
      ↓
保存 input/context/result snapshot
      ↓
Response DTO
```

---

# 43. 最终接口基线

当前健康模块 API 冻结为：

```text
GET    /api/health/profile
PUT    /api/health/profile


GET    /api/health/metrics
POST   /api/health/metrics
DELETE /api/health/metrics/:id

GET    /api/health/metrics/trend


GET    /api/health/metric-templates
POST   /api/health/metric-templates

GET    /api/health/metric-templates/:id
PATCH  /api/health/metric-templates/:id


POST   /api/health/analyses

GET    /api/health/analyses
GET    /api/health/analyses/:id


GET    /api/health/knowledge
GET    /api/health/knowledge/:id
```

核心原则：

1. 私人健康数据只基于 JWT 当前用户；
2. 客户端不传任意 `userId`；
3. 健康档案采用单例资源设计；
4. 所有健康指标统一使用 `/metrics`；
5. 指标请求通过 Zod discriminated union 校验；
6. 单位由服务端确定；
7. 血压趋势使用双序列；
8. 自定义指标趋势必须通过 `templateId`；
9. 自定义模板当前不提供物理删除接口；
10. AI 健康分析只接收用户“本次发生的情况”；
11. AI 健康分析不使用 Agent；
12. AI 输出必须通过 Zod 验证；
13. AI 历史列表与详情接口分离；
14. API DTO 不与数据库 JSONB 结构直接耦合；
15. 健康知识浏览、搜索和分类筛选共用一个列表接口；
16. 当前不增加 BMI、Dashboard、专项指标历史等冗余接口。

该设计作为智乡云 V2 健康模块用户侧接口开发基线。
