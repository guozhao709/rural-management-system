# 智乡云 V2 农业模块数据库设计 V1

> 项目：智乡云  
> 模块：农业  
> 文档性质：数据库设计基线  
> 版本：V1  
> 数据库：PostgreSQL  
> ORM：MikroORM  
> 项目级别：Competition / Demo  

---

# 1. 设计目标

本数据库设计基于《新农业模块需求》和《智乡云 V2 后端技术方案》，用于支撑农业模块当前 V2 业务闭环：

```text
创建地块档案
    ↓
AI 种植评估
    ↓
创建种植档案
    ↓
记录生长指标
    ↓
查看生长趋势
    ↓
AI 生长分析
    ↓
继续记录和管理
    ↓
完成采收 / 结束本轮种植
```

当前设计遵循以下原则：

1. PostgreSQL 是农业业务数据的 Source of Truth。
2. 地块与具体种植周期分离。
3. 生长指标定义与指标记录分离。
4. 公共作物数据、农业知识和用户私有农业数据分离。
5. AI 历史必须能够还原分析发生时使用的主要上下文。
6. AI 快照使用 JSONB，但核心业务实体仍采用结构化关系模型。
7. 确定性趋势计算由 TypeScript 完成，不交给 LLM 推测。
8. 当前不提前实现 IoT、产量预测、病害识别、复杂 RAG、模型版本治理等 V2 范围外能力。
9. 核心历史数据默认禁止级联删除。
10. 数据库设计以比赛 / Demo 项目所需复杂度为边界，避免过度工程化。

---

# 2. 总体表结构

当前农业模块设计 10 张核心业务表：

```text
Agriculture
│
├── 用户农业档案
│   ├── agriculture_lands
│   └── agriculture_plantings
│
├── 公共农业数据
│   ├── agriculture_crops
│   ├── agriculture_crop_aliases
│   ├── agriculture_knowledge
│   └── agriculture_knowledge_crops
│
├── 生长数据
│   ├── agriculture_growth_metrics
│   └── agriculture_growth_metric_records
│
└── AI 历史
    ├── agriculture_planting_evaluations
    └── agriculture_growth_analyses
```

核心关系：

```text
User
 │
 └── AgricultureLand
        │
        ├── PlantingEvaluation
        │
        └── AgriculturePlanting
               │
               ├── GrowthMetric
               │      │
               │      └── GrowthMetricRecord
               │
               └── GrowthAnalysis


AgricultureCrop
 │
 ├── CropAlias
 ├── AgriculturePlanting
 ├── PlantingEvaluation
 │
 └── AgricultureKnowledgeCrop
          │
          └── AgricultureKnowledge
```

---

# 3. agriculture_lands

## 3.1 作用

保存用户长期存在的地块档案。

地块描述：

> 我在哪里种东西，这块地大概是什么情况。

同一地块可以在不同时间产生多轮种植记录。

## 3.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| user_id | uuid | 否 | 所属用户 |
| name | varchar(100) | 否 | 地块名称 |
| province | varchar(50) | 否 | 省 |
| city | varchar(50) | 否 | 市 |
| district | varchar(50) | 否 | 区县 |
| planting_environment | varchar(32) | 否 | 种植环境 |
| area_value | numeric(12,2) | 是 | 地块面积 |
| area_unit | varchar(16) | 是 | 面积单位，如 mu / m2 |
| soil | varchar(100) | 是 | 土壤情况 |
| irrigation | varchar(32) | 是 | 灌溉条件 |
| drainage | varchar(32) | 是 | 排水情况 |
| description | text | 是 | 补充说明 |
| created_at | timestamptz | 否 | 创建时间 |
| updated_at | timestamptz | 否 | 更新时间 |

## 3.3 约束与索引

建议：

```text
INDEX(user_id)
INDEX(user_id, created_at)
```

所有用户私有农业数据最终通过 `agriculture_lands.user_id` 确定所有权。

客户端不得通过任意 `userId` 参数读取其他用户数据。

---

# 4. agriculture_plantings

## 4.1 作用

保存某个地块的一轮具体种植。

地块回答：

> 在哪里种。

种植档案回答：

> 这一轮正在种什么。

不同种植周期必须分别保存。

## 4.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| land_id | uuid | 否 | 所属地块 |
| crop_id | uuid | 否 | 标准作物 |
| variety | varchar(100) | 是 | 品种 |
| planting_date | date | 是 | 精确种植日期 |
| planting_time_text | varchar(100) | 是 | 模糊时间，如“2026年春季” |
| growth_stage | varchar(100) | 是 | 当前生长阶段 |
| status | varchar(32) | 否 | 当前种植状态 |
| description | text | 是 | 补充说明 |
| created_at | timestamptz | 否 | 创建时间 |
| updated_at | timestamptz | 否 | 更新时间 |

## 4.3 status

建议限定为：

```text
planned      计划种植
growing      正在种植
harvested    已采收
ended        已结束
```

## 4.4 种植时间规则

允许：

```text
planting_date != null
planting_time_text = null
```

或：

```text
planting_date = null
planting_time_text != null
```

或两者均为空，表示未知。

禁止：

```text
planting_date != null
planting_time_text != null
```

避免精确日期和模糊描述同时存在并发生冲突。

该约束可由 Zod / Service 层保证，也可在 PostgreSQL 增加 CHECK 约束。

## 4.5 索引

```text
INDEX(land_id)
INDEX(crop_id)
INDEX(land_id, status)
```

---

# 5. agriculture_crops

## 5.1 作用

保存系统公共作物基础信息。

该表不是用户私有数据。

## 5.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| standard_name | varchar(100) | 否 | 标准名称 |
| introduction | text | 是 | 基础介绍 |
| suitable_environment | text | 是 | 适宜生长环境 |
| growth_stages | jsonb | 是 | 常见生长阶段 |
| management_notes | text | 是 | 常见管理注意事项 |
| common_pests | jsonb | 是 | 常见病虫害 |
| created_at | timestamptz | 否 | 创建时间 |
| updated_at | timestamptz | 否 | 更新时间 |

## 5.3 约束

```text
UNIQUE(standard_name)
```

当前不建立复杂农业分类学、专业作物编码体系、独立生长阶段表或病虫害分类体系。

---

# 6. agriculture_crop_aliases

## 6.1 作用

保存作物常见名称和别名，用于搜索和标准作物匹配。

例如：

```text
番茄
├── 西红柿
└── 洋柿子
```

## 6.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| crop_id | uuid | 否 | 所属标准作物 |
| alias | varchar(100) | 否 | 作物别名 |

## 6.3 约束与索引

```text
UNIQUE(crop_id, alias)
INDEX(alias)
INDEX(crop_id)
```

不对 `alias` 单独设置全局唯一约束。

原因是不同地区可能存在相同俗名对应不同作物的情况。

---

# 7. agriculture_knowledge

## 7.1 作用

保存公共农业知识，用于用户浏览、搜索以及 AI 种植评估和 AI 生长分析。

## 7.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| title | varchar(255) | 否 | 标题 |
| category | varchar(50) | 否 | 知识类型 |
| content | text | 否 | 正文 |
| source_name | varchar(255) | 是 | 来源机构 |
| source_title | varchar(255) | 是 | 来源文档名称 |
| source_url | text | 是 | 来源链接 |
| tags | text[] | 是 | 普通检索标签 |
| region_tags | text[] | 是 | 适用地区标签 |
| created_at | timestamptz | 否 | 创建时间 |
| updated_at | timestamptz | 否 | 更新时间 |

## 7.3 category

当前可支持：

```text
planting_management
water_fertilizer
pest_control
weather_disaster
field_management
harvest_storage
growth_stage_management
```

## 7.4 region_tags

用于支持按地区检索知识。

例如：

```json
["陕西省", "西安市"]
```

全国通用知识可以为空数组或 NULL。

当前不建立复杂行政区划关系表。

## 7.5 索引

建议至少：

```text
INDEX(category)
```

如后续实际查询需要，可再为 `tags`、`region_tags` 增加 PostgreSQL GIN 索引，不提前实现。

---

# 8. agriculture_knowledge_crops

## 8.1 作用

建立农业知识与作物之间的多对多关系。

一条农业知识可以适用于多个作物，一个作物也可以关联多条知识。

## 8.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| knowledge_id | uuid | 否 | 农业知识 |
| crop_id | uuid | 否 | 作物 |

## 8.3 约束

```text
PRIMARY KEY(knowledge_id, crop_id)
```

该表属于纯关联表。

删除对应知识或作物时，可以对关系记录使用 `ON DELETE CASCADE`。

---

# 9. agriculture_growth_metrics

## 9.1 作用

定义某一次具体种植需要长期记录的数值型生长指标。

例如：

```text
2026 秋季豇豆
├── 豇豆长度 / cm
├── 植株高度 / cm
└── 每日采收重量 / kg
```

指标必须归属于具体 planting。

## 9.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| planting_id | uuid | 否 | 所属种植档案 |
| name | varchar(100) | 否 | 指标名称 |
| unit | varchar(32) | 否 | 单位 |
| created_at | timestamptz | 否 | 创建时间 |
| updated_at | timestamptz | 否 | 更新时间 |

## 9.3 约束

```text
UNIQUE(planting_id, name)
INDEX(planting_id)
```

当前只支持简单数值型指标，不实现公式型指标、复合指标或复杂指标模板。

---

# 10. agriculture_growth_metric_records

## 10.1 作用

保存某个生长指标的实际历史记录。

Metric 定义：

> 测什么。

Record 保存：

> 什么时间测出了多少。

例如：

```text
植株高度
├── 09-01  41 cm
├── 09-05  48 cm
├── 09-10  57 cm
└── 09-15  65 cm
```

## 10.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| metric_id | uuid | 否 | 所属指标 |
| value | numeric(14,4) | 否 | 数值 |
| recorded_at | timestamptz | 否 | 实际记录时间 |
| note | text | 是 | 备注 |
| created_at | timestamptz | 否 | 创建时间 |

不使用浮点数作为业务测量值默认存储类型。

## 10.3 索引

```text
INDEX(metric_id, recorded_at)
```

生长趋势、增长速度、上升 / 下降 / 稳定判断等确定性结果不额外持久化，由业务代码根据记录计算。

---

# 11. agriculture_planting_evaluations

## 11.1 作用

保存 AI 种植评估历史。

分析对象：

```text
地块
+
准备种植的作物
+
预计种植时间
+
相关农业知识
```

## 11.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| land_id | uuid | 否 | 本次评估使用的地块 |
| crop_id | uuid | 是 | 成功匹配的标准作物 |
| crop_name | varchar(100) | 否 | 用户本次实际输入/选择的名称 |
| variety | varchar(100) | 是 | 品种 |
| planned_planting_time | varchar(100) | 是 | 计划种植时间 |
| summary | text | 否 | AI 总结 |
| suitability | varchar(32) | 否 | 种植适宜性 |
| schema_version | smallint | 否 | JSON 快照结构版本 |
| input_snapshot | jsonb | 否 | 本次 AI 输入上下文快照 |
| result_snapshot | jsonb | 否 | Zod 校验后的完整 AI 输出 |
| created_at | timestamptz | 否 | 创建时间 |

## 11.3 suitability

允许：

```text
suitable
suitable_with_conditions
limited
not_recommended
```

禁止保存无可靠依据的 0～100 分或百分比适宜度。

## 11.4 crop_id 与 crop_name

`crop_name`：

```text
始终保存用户本次实际选择或输入的名称。
```

`crop_id`：

```text
只有系统成功解析到标准作物时才保存。
```

例如：

```text
crop_name = "西红柿"
crop_id   = 番茄.id
```

系统无法匹配：

```text
crop_name = "某地方甜瓜"
crop_id   = NULL
```

## 11.5 input_snapshot

用于保存分析发生时实际使用的上下文，例如：

```json
{
  "crop": {},
  "land": {},
  "plannedPlantingTime": "2027年春季",
  "knowledgeContext": []
}
```

地块信息以后发生修改，不影响历史评估的还原。

## 11.6 result_snapshot

保存经过 Zod 校验后的完整输出：

```json
{
  "summary": "",
  "suitability": "suitable_with_conditions",
  "advantages": [],
  "limitations": [],
  "plantingSuggestions": [],
  "preparations": [],
  "attentionPoints": [],
  "references": []
}
```

`summary` 和 `suitability` 普通列必须从同一个 Validated Result 派生。

禁止由两套逻辑分别写入。

## 11.7 schema_version

例如：

```text
schema_version = 1
```

该字段仅用于识别 JSON 数据结构版本。

它不是：

- Prompt 版本
- 模型版本
- AI 治理版本

当前不建设复杂 AI 版本治理。

## 11.8 索引

```text
INDEX(land_id, created_at)
INDEX(crop_id)
INDEX(suitability)
```

---

# 12. agriculture_growth_analyses

## 12.1 作用

保存 AI 生长分析历史。

每条记录必须能够还原：

1. 当时种植的作物和阶段；
2. 用户当时观察到了什么；
3. 当时使用的主要天气信息；
4. 当时使用的生长指标趋势；
5. AI 当时生成的结果；
6. 本次分析使用的农业知识。

## 12.2 字段设计

| 字段 | PostgreSQL 类型 | Null | 说明 |
|---|---|---:|---|
| id | uuid | 否 | 主键 |
| planting_id | uuid | 否 | 所属种植档案 |
| summary | text | 否 | AI 分析总结 |
| growth_status | varchar(32) | 否 | 当前生长状态 |
| schema_version | smallint | 否 | JSON 快照结构版本 |
| input_snapshot | jsonb | 否 | 本次输入上下文 |
| result_snapshot | jsonb | 否 | Zod 校验后的完整 AI 输出 |
| created_at | timestamptz | 否 | 创建时间 |

## 12.3 growth_status

允许：

```text
normal
needs_attention
abnormal
```

该字段只表达当前状态，不保存风险指数或百分比风险。

## 12.4 input_snapshot

例如：

```json
{
  "planting": {},
  "land": {},
  "observations": [
    "叶片发黄",
    "土壤过湿"
  ],
  "description": "",
  "weather": {},
  "growthMetrics": [],
  "knowledgeContext": []
}
```

天气、生长趋势和农业知识均保存当时实际提供给 AI 的快照，而不是分析历史查询时重新获取当前数据。

## 12.5 result_snapshot

保存：

```json
{
  "summary": "",
  "growthStatus": "needs_attention",
  "currentSituation": [],
  "concerns": [],
  "possibleFactors": [],
  "managementSuggestions": [],
  "followUp": [],
  "references": []
}
```

`summary` 和 `growth_status` 必须从同一个经过 Zod 校验的结果派生。

## 12.6 索引

```text
INDEX(planting_id, created_at)
INDEX(growth_status)
```

---

# 13. AI 数据保存原则

AI 种植评估和 AI 生长分析统一采用：

```text
Structured Input
      ↓
Context Builder
      ↓
Prompt Builder
      ↓
LLM
      ↓
Structured Output
      ↓
Zod Validation
      ↓
Validated Result
      ↓
Database
```

数据库只保存通过 Zod 校验的数据。

## 13.1 普通列 + JSONB

AI 历史采用：

```text
关键列表查询字段
→ 普通 Column

完整输入 / 输出历史
→ JSONB Snapshot
```

例如：

```text
summary
growth_status
```

保留普通列。

完整 AI 数据保存：

```text
input_snapshot
result_snapshot
```

这样既方便列表查询，又可以完整恢复历史。

---

# 14. 天气数据原则

当前不建立：

```text
agriculture_weather_records
```

天气属于独立 WeatherService / Weather Tool 能力，而不是农业核心业务实体。

实时流程：

```text
GrowthAnalysis Context Builder
        ↓
WeatherService
        ↓
标准化天气摘要
        ↓
AI Input
```

本次 AI 分析实际使用的天气摘要写入：

```text
agriculture_growth_analyses.input_snapshot
```

天气查询失败时必须明确表示 Unavailable，不允许生成模拟天气。

---

# 15. observations 数据原则

当前不建立独立：

```text
agriculture_observations
```

用户填写的：

```text
叶片发黄
土壤过湿
```

属于某一次具体 AI 生长分析的输入，而不是当前 V2 中拥有独立生命周期的业务实体。

因此统一保存于：

```text
agriculture_growth_analyses.input_snapshot
```

未来如果新增独立田间观察日志功能，再单独设计 Observation 业务表。

---

# 16. AI 引用数据原则

当前不建立：

```text
planting_evaluation_knowledge_refs
growth_analysis_knowledge_refs
```

复杂关系表。

AI 本次实际参考的知识信息直接保存于对应 JSON 快照中的：

```text
knowledgeContext
references
```

用于还原历史。

当前不建设复杂知识版本治理系统。

---

# 17. 用户数据隔离

农业用户私有数据的所有权链：

```text
User
 └── Land
      └── Planting
           ├── GrowthMetric
           │    └── GrowthMetricRecord
           └── GrowthAnalysis
```

只有：

```text
agriculture_lands.user_id
```

直接保存用户 ID。

下级数据通过关联关系向上验证当前用户所有权。

例如读取生长记录：

```text
GrowthMetricRecord
→ GrowthMetric
→ Planting
→ Land
→ user_id
```

必须判断：

```text
land.user_id === currentUser.id
```

客户端传入的任意 `userId` 不得作为用户数据所有权依据。

---

# 18. 外键删除策略

## 18.1 核心历史业务链

以下关系默认采用：

```text
ON DELETE RESTRICT
```

包括：

```text
Land → Planting
Land → PlantingEvaluation
Planting → GrowthMetric
Planting → GrowthAnalysis
Crop → Planting
```

目的：

> 防止删除一个上级实体后，大量历史业务数据被自动级联删除。

对于已经完成的种植，优先使用：

```text
status = harvested / ended
```

表示生命周期结束，而不是删除历史。

## 18.2 纯关系数据

例如：

```text
agriculture_knowledge_crops
```

属于纯关联数据。

对应知识或作物被删除时，可以：

```text
ON DELETE CASCADE
```

删除其关系记录。

---

# 19. 当前不设计的表

V2 当前明确不增加：

```text
weather_records
iot_devices
iot_sensor_records
market_prices
yield_predictions
harvest_predictions
disease_diagnoses
agriculture_observations
farm_operations
fertilizer_records
pesticide_records
irrigation_records
ai_model_versions
prompt_versions
token_usage_business_records
vector_embeddings
```

这些能力如果未来正式进入业务范围，应重新设计，不在当前数据库中提前占位。

---

# 20. ER 关系总结

```text
users
  │
  │ 1:N
  ▼
agriculture_lands
  │
  ├────────────────┐
  │ 1:N            │ 1:N
  ▼                ▼
agriculture_plantings
                   agriculture_planting_evaluations
  │
  ├────────────────┐
  │ 1:N            │ 1:N
  ▼                ▼
agriculture_growth_metrics
                   agriculture_growth_analyses
  │
  │ 1:N
  ▼
agriculture_growth_metric_records


agriculture_crops
  │
  ├── 1:N agriculture_crop_aliases
  │
  ├── 1:N agriculture_plantings
  │
  ├── 1:N agriculture_planting_evaluations
  │
  └── N:M agriculture_knowledge
             │
             └── agriculture_knowledge_crops
```

---

# 21. 最终表清单

| # | 表名 | 类型 | 作用 |
|---:|---|---|---|
| 1 | agriculture_lands | 用户数据 | 地块档案 |
| 2 | agriculture_plantings | 用户数据 | 具体种植周期 |
| 3 | agriculture_crops | 公共数据 | 作物信息 |
| 4 | agriculture_crop_aliases | 公共数据 | 作物别名 |
| 5 | agriculture_knowledge | 公共数据 | 农业知识 |
| 6 | agriculture_knowledge_crops | 公共关系 | 知识与作物关联 |
| 7 | agriculture_growth_metrics | 用户数据 | 生长指标定义 |
| 8 | agriculture_growth_metric_records | 用户时序数据 | 生长指标记录 |
| 9 | agriculture_planting_evaluations | AI 历史 | 种植评估历史 |
| 10 | agriculture_growth_analyses | AI 历史 | 生长分析历史 |

---

# 22. 当前冻结结论

农业模块 V1 数据库结构冻结为 10 张核心业务表。

本版已经覆盖：

```text
地块档案
+
种植档案
+
作物信息
+
农业知识
+
AI 种植评估
+
生长指标
+
生长趋势基础数据
+
AI 生长分析历史
```

核心建模原则冻结为：

```text
Land ≠ Planting

Metric ≠ MetricRecord

公共作物 / 知识 ≠ 用户私有农业数据

AI 当前结果 ≠ 历史上下文
```

AI 历史统一采用：

```text
关键查询字段普通列
+
Input JSONB Snapshot
+
Result JSONB Snapshot
+
schema_version
```

当前 V2 不继续扩展额外数据库能力。

后续接口设计、MikroORM Entity 和 Migration 应以本数据库设计作为农业模块数据库基线。
