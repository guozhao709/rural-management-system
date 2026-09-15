# 新健康业务数据库设计

> 项目：智乡云 V2  
> 模块：健康  
> 文档性质：数据库设计基线  
> 数据库：PostgreSQL  
> ORM：MikroORM  
> 项目级别：Competition / Demo  
> 状态：当前版本冻结

---

# 1. 文档目标

本文档用于定义智乡云 V2 健康模块的数据库结构。

数据库设计以以下业务为基础：

1. 健康档案；
2. 健康指标跟踪；
3. 自定义健康指标模板；
4. AI 健康分析历史；
5. 健康知识。

当前版本不按照医疗信息系统建设数据库，不引入疾病诊断、电子病历、医学编码、临床规则、医疗审计等复杂结构。

设计原则：

- 业务优先；
- 保持模型简单；
- 避免过度拆表；
- 保证历史数据可还原；
- 确定性计算结果不重复持久化；
- 为未来扩展保留合理边界，但不提前建设未来业务。

---

# 2. 数据库总体结构

当前健康模块共包含 5 张核心表：

```text
health_profiles

health_metric_templates

health_metric_records

health_analyses

health_knowledge
```

与用户表关系：

```text
users
 │
 ├── 1 : 1 ── health_profiles
 │
 ├── 1 : N ── health_metric_templates
 │                    │
 │                    └── 1 : N ── health_metric_records
 │
 ├── 1 : N ── health_metric_records
 │
 └── 1 : N ── health_analyses

health_knowledge
```

其中：

- `health_profiles`：用户健康档案；
- `health_metric_templates`：用户自定义健康指标模板；
- `health_metric_records`：所有健康指标历史记录；
- `health_analyses`：AI 健康分析历史；
- `health_knowledge`：公共健康知识。

---

# 3. 设计原则

## 3.1 不保存可确定性计算的数据

以下数据不单独持久化：

- 年龄；
- BMI；
- 平均值；
- 最大值；
- 最小值；
- 变化量；
- 简单上升 / 下降 / 稳定趋势。

例如：

```text
出生日期
    ↓
TypeScript
    ↓
年龄
```

```text
身高
+
最近体重
    ↓
TypeScript
    ↓
BMI
```

```text
历史指标记录
    ↓
TypeScript
    ↓
平均值 / 最大值 / 最小值 / 趋势
```

数据库保存事实数据，确定性结果由业务代码计算。

---

## 3.2 用户私人数据必须绑定当前用户

以下表必须通过 `user_id` 与当前认证用户绑定：

```text
health_profiles
health_metric_templates
health_metric_records
health_analyses
```

客户端不得通过传入任意 `userId` 访问其他用户数据。

---

## 3.3 AI 分析历史采用快照

AI 健康分析必须保存：

```text
用户当时输入
+
系统当时使用的健康上下文
+
AI 当时输出的结果
```

因此健康分析历史采用 JSONB 快照，而不是仅保存当前档案、当前指标的外键引用。

---

# 4. health_profiles

## 4.1 业务职责

保存用户相对稳定的健康背景信息。

一名用户最多拥有一份健康档案。

---

## 4.2 表结构

| 字段 | PostgreSQL 类型 | 允许 NULL | 说明 |
|---|---|---:|---|
| id | UUID | 否 | 主键 |
| user_id | UUID | 否 | 用户 ID |
| sex | VARCHAR(20) | 是 | 性别 |
| birth_date | DATE | 是 | 出生日期 |
| height_cm | NUMERIC(5,2) | 是 | 身高，单位 cm |
| smoking_status | VARCHAR(20) | 是 | 吸烟情况 |
| drinking_status | VARCHAR(20) | 是 | 饮酒情况 |
| exercise_status | VARCHAR(20) | 是 | 运动情况 |
| sleep_status | VARCHAR(20) | 是 | 睡眠情况 |
| health_history | TEXT | 是 | 用户填写的既往健康情况 |
| allergies | TEXT | 是 | 过敏情况 |
| created_at | TIMESTAMPTZ | 否 | 创建时间 |
| updated_at | TIMESTAMPTZ | 否 | 更新时间 |

---

## 4.3 约束

```text
PRIMARY KEY (id)

FOREIGN KEY (user_id)
REFERENCES users(id)

UNIQUE (user_id)
```

保证：

> 一个用户最多只有一份健康档案。

---

## 4.4 字段设计说明

### 出生日期而不是年龄

数据库保存：

```text
birth_date
```

不保存：

```text
age
```

年龄由当前日期和出生日期实时计算。

### 身高保存在档案中

身高属于相对稳定的身体信息，因此保存在健康档案。

### 体重不保存在档案中

体重属于可持续变化的健康指标，应写入：

```text
health_metric_records
```

### 不保存 BMI

BMI 属于确定性计算结果，由：

```text
height_cm + latest weight
```

实时计算。

---

## 4.5 状态字段设计

以下字段当前使用 `VARCHAR`：

```text
sex
smoking_status
drinking_status
exercise_status
sleep_status
```

当前不使用 PostgreSQL ENUM。

具体允许值由：

```text
TypeScript
+
Zod
```

控制。

这样未来调整业务选项时，不需要修改 PostgreSQL Enum 类型。

---

# 5. health_metric_templates

## 5.1 业务职责

保存用户创建的简单自定义健康指标模板。

典型场景：

```text
发烧期间体温
近期静息心率
某阶段睡眠时长
```

模板只承担：

> 描述“用户想跟踪什么”。

具体记录仍统一存储于：

```text
health_metric_records
```

---

## 5.2 表结构

| 字段 | PostgreSQL 类型 | 允许 NULL | 说明 |
|---|---|---:|---|
| id | UUID | 否 | 主键 |
| user_id | UUID | 否 | 创建用户 |
| name | VARCHAR(100) | 否 | 模板名称 |
| metric_name | VARCHAR(100) | 否 | 指标名称 |
| unit | VARCHAR(30) | 否 | 单位 |
| related_system_metric_type | VARCHAR(30) | 是 | 可关联的系统预置指标 |
| started_at | TIMESTAMPTZ | 否 | 跟踪开始时间 |
| ended_at | TIMESTAMPTZ | 是 | 跟踪结束时间 |
| created_at | TIMESTAMPTZ | 否 | 创建时间 |
| updated_at | TIMESTAMPTZ | 否 | 更新时间 |

---

## 5.3 related_system_metric_type

用于标记自定义模板是否与系统已有指标存在直接关系。

例如：

```text
模板：发烧期间体温

related_system_metric_type:
temperature
```

这样 AI Context Builder 可以理解该模板与体温相关。

允许值建议：

```text
weight
blood_pressure
heart_rate
temperature
NULL
```

例如：

```text
睡眠时长
```

当前不是系统预置健康指标，因此可以：

```text
related_system_metric_type = NULL
```

---

## 5.4 不保存 tracking_mode

数据库不增加：

```text
tracking_mode
```

长期 / 阶段性跟踪通过生命周期表达：

```text
started_at
ended_at
```

例如：

```text
started_at = 2026-09-01
ended_at   = 2026-09-05
```

表示阶段性跟踪。

```text
started_at = 2026-09-01
ended_at   = NULL
```

表示当前仍在持续跟踪。

---

## 5.5 删除原则

已经存在历史记录的模板不应物理删除。

外键推荐：

```text
health_metric_records.template_id
        ↓
health_metric_templates.id

ON DELETE RESTRICT
```

阶段性跟踪结束时：

```text
设置 ended_at
```

而不是删除模板。

---

# 6. health_metric_records

## 6.1 业务职责

统一保存所有健康指标历史记录。

系统预置指标：

```text
weight
blood_pressure
heart_rate
temperature
```

用户自定义指标：

```text
custom
```

全部共用该表。

---

## 6.2 表结构

| 字段 | PostgreSQL 类型 | 允许 NULL | 说明 |
|---|---|---:|---|
| id | UUID | 否 | 主键 |
| user_id | UUID | 否 | 用户 ID |
| metric_type | VARCHAR(30) | 否 | 指标类型 |
| template_id | UUID | 是 | 自定义指标模板 |
| numeric_value | NUMERIC | 是 | 单值型指标值 |
| systolic_value | NUMERIC | 是 | 血压收缩压 |
| diastolic_value | NUMERIC | 是 | 血压舒张压 |
| unit | VARCHAR(30) | 否 | 记录时单位快照 |
| measured_at | TIMESTAMPTZ | 否 | 实际测量时间 |
| created_at | TIMESTAMPTZ | 否 | 数据创建时间 |

---

# 7. metric_type

允许值：

```text
weight
blood_pressure
heart_rate
temperature
custom
```

不为每一种指标单独建立数据表。

即不创建：

```text
weight_records
temperature_records
heart_rate_records
blood_pressure_records
```

统一数据结构更适合当前 V2。

---

# 8. 单值指标

以下指标使用：

```text
numeric_value
```

包括：

```text
weight
heart_rate
temperature
custom
```

例如：

```text
weight

numeric_value = 65.2
unit = kg
```

```text
temperature

numeric_value = 38.5
unit = ℃
```

---

# 9. 血压指标

血压使用两个独立字段：

```text
systolic_value
diastolic_value
```

例如：

```text
systolic_value  = 128
diastolic_value = 82
unit            = mmHg
```

不将血压存为：

```text
"128/82"
```

也不使用 JSONB 保存血压。

这样更方便数据库查询、排序、统计和趋势分析。

---

# 10. template_id

系统预置指标：

```text
weight
blood_pressure
heart_rate
temperature
```

必须：

```text
template_id IS NULL
```

自定义指标：

```text
metric_type = custom
```

必须：

```text
template_id IS NOT NULL
```

模板必须属于当前用户。

---

# 11. unit

`unit` 保存在记录表中，是：

> 记录发生时的单位快照。

系统预置单位例如：

```text
weight         → kg
temperature    → ℃
heart_rate     → bpm
blood_pressure → mmHg
```

自定义指标的单位来自：

```text
health_metric_templates.unit
```

写入记录时复制一份单位快照。

这样即使未来模板单位发生变化，也不会影响旧记录的真实语义。

---

# 12. 数据一致性约束

建议数据库增加 CHECK 约束。

## 12.1 普通单值指标

当：

```text
metric_type IN (
  weight,
  heart_rate,
  temperature,
  custom
)
```

必须满足：

```text
numeric_value IS NOT NULL

systolic_value IS NULL

diastolic_value IS NULL
```

---

## 12.2 血压

当：

```text
metric_type = blood_pressure
```

必须满足：

```text
numeric_value IS NULL

systolic_value IS NOT NULL

diastolic_value IS NOT NULL
```

---

## 12.3 系统指标模板约束

当：

```text
metric_type IN (
  weight,
  blood_pressure,
  heart_rate,
  temperature
)
```

必须：

```text
template_id IS NULL
```

---

## 12.4 自定义指标模板约束

当：

```text
metric_type = custom
```

必须：

```text
template_id IS NOT NULL
```

---

# 13. health_analyses

## 13.1 业务职责

保存每一次 AI 健康分析历史。

历史记录必须能够还原：

1. 用户当时输入什么；
2. 系统当时使用什么健康上下文；
3. AI 当时输出什么结果。

---

## 13.2 表结构

| 字段 | PostgreSQL 类型 | 允许 NULL | 说明 |
|---|---|---:|---|
| id | UUID | 否 | 主键 |
| user_id | UUID | 否 | 用户 ID |
| input_snapshot | JSONB | 否 | 用户输入快照 |
| context_snapshot | JSONB | 否 | AI 使用的健康上下文快照 |
| result_snapshot | JSONB | 否 | AI 输出结果快照 |
| schema_version | VARCHAR(20) | 是 | JSON 结构版本，可选 |
| created_at | TIMESTAMPTZ | 否 | 分析时间 |

---

# 14. input_snapshot

保存本次用户主动输入。

示例：

```json
{
  "symptoms": [
    "dizziness",
    "fatigue"
  ],
  "severity": "moderate",
  "duration": "1_3_days",
  "description": "最近几天晚上睡得比较晚，昨天干活时突然出现头晕。"
}
```

当前不建立：

```text
symptoms
analysis_symptoms
```

等独立关系表。

---

# 15. context_snapshot

保存 AI 分析时系统实际使用的健康上下文。

示例：

```json
{
  "profile": {
    "age": 20,
    "sex": "male",
    "heightCm": 175,
    "smokingStatus": "never",
    "sleepStatus": "average",
    "healthHistory": null,
    "allergies": null
  },
  "latestMetrics": {
    "weight": {
      "value": 65.2,
      "unit": "kg"
    },
    "bloodPressure": {
      "systolic": 128,
      "diastolic": 82,
      "unit": "mmHg"
    }
  },
  "statistics": {
    "bmi": 21.29,
    "weightTrend": "stable"
  },
  "customTracking": [],
  "knowledge": []
}
```

该字段是历史快照。

以后用户修改档案或新增指标，不会改变过去 AI 分析的上下文。

---

# 16. result_snapshot

保存通过 Zod 验证后的结构化 AI 输出。

示例：

```json
{
  "summary": "……",
  "concerns": [
    "……"
  ],
  "factors": [
    "……"
  ],
  "suggestions": [
    "……"
  ],
  "medicalAdvice": "……",
  "references": [
    {
      "knowledgeId": "uuid",
      "title": "……",
      "source": "……"
    }
  ]
}
```

数据库不将以上字段进一步拆成多张表。

---

# 17. schema_version

`schema_version` 为可选字段。

用途：

> 当未来 AI JSON 结构发生变化时，帮助后端识别历史快照结构。

例如：

```text
schema_version = v1
```

当前如果希望保持最小实现，也可以暂不启用该字段。

---

# 18. health_knowledge

## 18.1 业务职责

保存健康科普知识。

知识同时服务：

- 用户浏览；
- 用户搜索；
- AI 健康分析；
- 后续 AI Chat。

---

## 18.2 表结构

| 字段 | PostgreSQL 类型 | 允许 NULL | 说明 |
|---|---|---:|---|
| id | UUID | 否 | 主键 |
| title | VARCHAR(200) | 否 | 标题 |
| summary | TEXT | 是 | 摘要 |
| content | TEXT | 否 | 正文 |
| category | VARCHAR(50) | 否 | 分类 |
| tags | TEXT[] | 否 | 标签 |
| source_name | VARCHAR(200) | 否 | 来源名称 |
| source_url | TEXT | 是 | 来源链接 |
| is_published | BOOLEAN | 否 | 是否发布 |
| created_at | TIMESTAMPTZ | 否 | 创建时间 |
| updated_at | TIMESTAMPTZ | 否 | 更新时间 |

---

# 19. 健康知识来源

至少必须保存：

```text
source_name
```

例如：

```text
国家卫生健康委员会
世界卫生组织
中国疾病预防控制中心
```

`source_url` 允许为空。

原因是部分可信内容可能来自：

```text
PDF
指南
出版物
其他可核验来源
```

并不一定始终存在稳定 URL。

---

# 20. tags

当前使用：

```text
TEXT[]
```

例如：

```text
["血压", "高盐饮食", "生活方式"]
```

当前不使用 JSONB。

原因是标签当前只是一组字符串，不存在复杂的标签对象结构。

---

# 21. 当前不建立的表

V2 当前不建立：

```text
health_symptoms

health_bmi

health_trends

health_statistics

health_analysis_context

health_analysis_results

health_analysis_knowledge_refs

health_metric_definitions

health_metric_categories
```

原因：

- 症状属于一次分析的输入；
- BMI 和趋势属于确定性派生数据；
- AI 输入 / 上下文 / 输出适合保存为快照；
- 当前指标种类较少，不需要引入统一指标定义层。

---

# 22. 索引设计

当前建议建立以下索引。

## health_profiles

```text
UNIQUE INDEX (user_id)
```

---

## health_metric_templates

```text
INDEX (user_id)

INDEX (user_id, ended_at)
```

---

## health_metric_records

```text
INDEX (
  user_id,
  metric_type,
  measured_at
)
```

```text
INDEX (
  template_id,
  measured_at
)
```

---

## health_analyses

```text
INDEX (
  user_id,
  created_at
)
```

---

## health_knowledge

```text
INDEX (
  category,
  is_published
)
```

当前知识规模较小，不要求引入：

```text
pgvector
Elasticsearch
复杂全文检索索引
```

---

# 23. 外键删除策略

推荐：

## health_profiles

```text
user_id
→ users.id
```

用户删除时具体策略由全局用户模块决定。

---

## health_metric_templates

```text
user_id
→ users.id
```

---

## health_metric_records

```text
user_id
→ users.id
```

```text
template_id
→ health_metric_templates.id

ON DELETE RESTRICT
```

---

## health_analyses

```text
user_id
→ users.id
```

---

# 24. 最终数据库结构

```text
Health
│
├── health_profiles
│   └── 用户健康档案
│
├── health_metric_templates
│   └── 用户自定义健康指标模板
│
├── health_metric_records
│   ├── 体重
│   ├── 血压
│   ├── 心率
│   ├── 体温
│   └── 自定义数值指标
│
├── health_analyses
│   ├── input_snapshot
│   ├── context_snapshot
│   └── result_snapshot
│
└── health_knowledge
    └── 健康知识及可信来源
```

---

# 25. 最终设计基线

当前 V2 健康模块数据库冻结为 5 张核心表：

```text
health_profiles

health_metric_templates

health_metric_records

health_analyses

health_knowledge
```

核心设计原则：

1. 一个用户最多一份健康档案；
2. 系统指标和自定义指标共用 `health_metric_records`；
3. 血压作为双值指标单独使用收缩压 / 舒张压字段；
4. 自定义模板与指标记录分离；
5. 长期 / 阶段性跟踪通过模板生命周期表达；
6. BMI、平均值、最大值、最小值、趋势等不持久化；
7. 指标记录必须使用数据库约束保证数据一致性；
8. 指标记录保存单位快照；
9. 已产生记录的自定义模板不物理删除；
10. AI 分析历史采用输入、上下文、输出三段 JSONB 快照；
11. AI 历史不能依赖当前档案重新构造过去上下文；
12. 健康知识必须保留明确来源；
13. 当前不引入指标定义层、向量数据库或复杂医疗数据模型。

该设计作为智乡云 V2 健康模块数据库开发基线。
