# 农业模块需求（Agent 版）

> Project: 智乡云  
> Document Role: CURRENT_REQUIREMENT  
> Domain: Agriculture  
> Status: V2 Business Requirement Baseline  
> Project Level: Competition / Demo  
> Scope: BUSINESS REQUIREMENTS ONLY  
> This document is a Source of Truth for the agriculture domain.

---

# 0. Agent Instructions

本项目不是正式农业生产 SaaS，也不是大型农业管理平台。

Agent 在分析、设计或实现农业模块时，必须遵守以下原则：

1. MUST 以本文档定义的农业业务为准。
2. MUST NOT 擅自扩展为农业 ERP、农业 SaaS、农业物联网平台。
3. MUST NOT 因“生产最佳实践”“未来可能需要”“企业级架构”等理由主动增加未定义业务。
4. MUST 优先保证业务闭环、用户体验、可演示性和代码可维护性。
5. SHOULD 为明确未来扩展保留合理空间，但 MUST NOT 提前实现未来功能。
6. MUST NOT 把技术实现细节反向升级为业务需求。
7. 后续数据库、API、前端 UI 设计不得改变本文档的核心业务边界。
8. 本文档中“当前版本明确不做”的内容属于明确禁止主动实现的范围。
9. AI 输入和输出必须保持结构化，不得自行改造成自由对话式农业 Agent。
10. AI 种植评估和 AI 生长分析是两个独立业务入口、两套独立 JSON 结构，不得强行合并成单一 analysisType 大接口，除非需求文档后续明确修改。

---

# 1. Domain Definition

农业模块是智乡云三个核心业务之一：

- 农业
- 健康
- AI 问答

农业模块的业务目标：

> 通过农业档案、作物生长数据和农业知识，帮助用户在种植前判断是否适合种植，在种植后持续记录生长变化，并通过 AI 对当前种植状态进行辅助分析和管理建议。

农业模块 MUST NOT 被定义为：

- 农业 ERP
- 农业生产 SaaS
- 农资库存系统
- 农产品交易系统
- 农业 IoT 平台
- 专业病虫害诊断系统

---

# 2. Current Scope

V2 农业模块只包含以下业务能力：

```text
Agriculture
├── Agriculture Archive
│   ├── Land Profile
│   └── Planting Profile
├── Crop Information
├── Agriculture Knowledge
├── AI Planting Evaluation
├── Crop Growth Metric Tracking
└── AI Growth Analysis
```

新增一级业务能力视为需求变更。

---

# 3. Agriculture Archive

农业档案用于保存可被重复用于农业分析、但不会每天变化的农业上下文。

农业档案由两层组成：

```text
Agriculture Archive
├── Land Profile
└── Planting Profile
```

农业档案 MUST NOT 被扩展成复杂农业台账系统。

---

# 4. Land Profile

## 4.1 Purpose

Land Profile 回答：

> “用户在哪里种，这块地大概是什么情况。”

## 4.2 Required Business Fields

至少包含：

- 地块名称
- 所在地区
- 种植环境

### Region

建议至少到区县级，可用于：

- 获取天气；
- 区域种植评估；
- 农业知识检索。

### Planting Environment

建议枚举：

- open_field
- greenhouse
- home_garden
- balcony_or_yard
- other

## 4.3 Optional Business Fields

可包含：

- 面积
- 土壤情况
- 灌溉条件
- 排水情况
- 补充说明

要求：

- MUST NOT 强制用户提供精确土壤检测值；
- MUST NOT 因用户未填写土壤或灌溉信息而禁止核心功能；
- 未知字段视为 unknown，不得由 AI 猜测。

---

# 5. Planting Profile

## 5.1 Purpose

Planting Profile 回答：

> “某块地的这一轮正在种什么。”

Planting Profile MUST 属于一个 Land Profile。

## 5.2 Required Fields

至少：

- crop
- land

## 5.3 Optional Fields

可包含：

- variety
- plantingDate
- growthStage
- status
- description

### Status

建议：

- planned
- growing
- harvested
- finished

未知 growthStage MUST 被允许。

---

# 6. Crop Information

Crop Information 服务：

- 用户直接查看；
- AI Planting Evaluation；
- AI Growth Analysis；
- AI Q&A。

用户 SHOULD 能：

- 搜索作物；
- 使用别名搜索；
- 查看作物详情。

内容可包含：

- 标准名称
- 常见别名
- 基础介绍
- 适宜环境
- 常见生长阶段
- 管理注意事项
- 常见病虫害
- 相关农业知识

MUST NOT 引入无业务必要的复杂农业分类学体系。

---

# 7. Agriculture Knowledge

Agriculture Knowledge 同时服务：

- 用户直接浏览；
- AI Planting Evaluation；
- AI Growth Analysis；
- AI Q&A。

内容可包括：

- 种植管理
- 水肥管理
- 病虫害
- 气象防灾
- 田间管理
- 采收储存
- 生长阶段管理

农业知识 SHOULD 包含明确来源，例如 source 和 sourceUrl（如存在）。

MUST NOT 将无来源 AI 自动生成文本直接视为可信农业知识。

---

# 8. AI Planting Evaluation

## 8.1 Definition

AI Planting Evaluation 解决：

> “某个作物放到某块地里，适不适合种？种之前应该注意什么？”

分析对象：

```text
Land Profile + Candidate Crop
```

AI Planting Evaluation 是独立业务入口。

MUST NOT 要求存在 Planting Profile。

MUST NOT 要求：

- growthStage
- observations
- currentIssue
- growthMetrics
- 短期天气

除非未来需求明确变化。

---

# 9. AI Planting Evaluation Input JSON Baseline

```json
{
  "crop": {
    "name": "番茄",
    "variety": null
  },
  "land": {
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
  },
  "plannedPlantingTime": "2027年春季",
  "knowledgeContext": []
}
```

字段规则：

| Field | Required | Source |
|---|---:|---|
| crop.name | MUST | User |
| crop.variety | MAY | User |
| land.region | MUST | Land Profile |
| land.plantingEnvironment | MUST | Land Profile |
| land.area | MAY | Land Profile |
| land.soil | MAY | Land Profile |
| land.irrigation | MAY | Land Profile |
| land.drainage | MAY | Land Profile |
| land.description | MAY | Land Profile |
| plannedPlantingTime | MAY | User |
| knowledgeContext | System | Knowledge Retrieval |

Rule:

> 用户选择已有地块后，Land Profile 信息 MUST 自动读取，不要求重复填写。

---

# 10. AI Planting Evaluation Output JSON Baseline

```json
{
  "summary": "...",
  "suitability": "suitable_with_conditions",
  "advantages": [],
  "limitations": [],
  "plantingSuggestions": [],
  "preparations": [],
  "attentionPoints": [],
  "references": []
}
```

## 10.1 suitability

Allowed values:

```text
suitable
suitable_with_conditions
limited
not_recommended
```

MUST NOT 输出：

- 0-100 分适宜度
- 百分比适宜度
- 无依据的精确评分

## 10.2 advantages

没有明确内容时可返回空数组。

MUST NOT 为填满字段而编造优势。

## 10.3 limitations

限制种植的因素。

## 10.4 plantingSuggestions

如果决定种植，应如何安排和管理。

## 10.5 preparations

种植前准备事项。

## 10.6 attentionPoints

后续重点注意事项。

## 10.7 references

农业知识引用。

---

# 11. Crop Growth Metric Tracking

Crop Growth Metric Tracking 用于持续记录某一次具体种植过程中的可量化数据。

Metric MUST 属于一个具体 Planting Profile。

当前版本 SHOULD 支持：

- 创建简单数值指标；
- 添加记录；
- 查看历史记录；
- 删除错误记录；
- 查看趋势图。

Example Metrics:

- 豇豆长度
- 番茄果径
- 植株高度
- 果实重量
- 结果数量
- 每日采收重量

当前指标只需：

- name
- unit
- value
- recordedAt
- note

MUST NOT 当前实现：

- 自定义复杂公式
- 自定义统计函数
- 自定义图表平台
- 低代码农业数据分析器
- 成熟时间预测
- 采摘时间预测
- 产量预测

Current V2:

```text
Record
+
History
+
Trend
```

Future only:

```text
Prediction
```

---

# 12. AI Growth Analysis

AI Growth Analysis 解决：

> “已经种下的这一批作物，现在是什么情况？有什么问题？接下来应该怎么管理？”

分析对象：

```text
Existing Planting Profile
```

AI Growth Analysis MUST 从一个具体种植档案进入。

用户 MUST NOT 被要求重新填写已存在的：

- crop
- land
- region
- planting environment

---

# 13. AI Growth Analysis Input JSON Baseline

```json
{
  "planting": {
    "crop": {
      "name": "番茄",
      "variety": null
    },
    "plantingDate": "2026-04-10",
    "growthStage": "结果期"
  },
  "land": {
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
  "observations": [
    "叶片发黄",
    "土壤过湿"
  ],
  "description": "最近连续下雨，下面几片叶子开始发黄。",
  "weather": {
    "summary": "过去两天连续降雨，未来两天仍有降雨可能"
  },
  "growthMetrics": [
    {
      "name": "植株高度",
      "unit": "cm",
      "latestValue": 82,
      "trend": "stable",
      "recentValues": [80, 81, 82, 82]
    }
  ],
  "knowledgeContext": []
}
```

字段规则：

| Field | Required | Source |
|---|---:|---|
| planting.crop.name | MUST | Planting Profile |
| planting.crop.variety | MAY | Planting Profile |
| planting.plantingDate | MAY | Planting Profile |
| planting.growthStage | MAY | Planting Profile / User |
| land | System | Land Profile |
| observations | MAY | User |
| description | MAY | User |
| weather | System | Weather Capability |
| growthMetrics | System | Metric Tracking |
| knowledgeContext | System | Knowledge Retrieval |

Recommendation:

> observations 与 description SHOULD 至少有一个非空。

---

# 14. Weather Rules

Weather 用于解释当前种植环境。

System SHOULD 提供整理后的天气摘要，而不是无差别传入所有原始天气字段。

例如：

```json
{
  "summary": "近期连续降雨，未来两天仍可能有雨，暂无明显高温天气"
}
```

Rules:

- MUST 使用真实天气数据；
- MUST NOT 模拟实时天气；
- MUST NOT 伪造天气；
- 如果天气不可用，必须明确缺失；
- 不相关天气字段 SHOULD NOT 被塞入 AI Context。

---

# 15. Growth Metric Context Rules

如果存在与当前分析相关的生长指标，可以向 AI 提供摘要，例如：

```json
{
  "name": "豇豆长度",
  "unit": "cm",
  "latestValue": 31,
  "trend": "increasing",
  "recentValues": [14, 19, 25, 31]
}
```

Current AI MAY 对趋势进行解释。

Current AI MUST NOT：

- 推断最佳采摘日期；
- 预测成熟日期；
- 预测产量；

除非后续需求明确增加预测能力。

---

# 16. AI Growth Analysis Output JSON Baseline

```json
{
  "summary": "...",
  "growthStatus": "needs_attention",
  "currentSituation": [],
  "concerns": [],
  "possibleFactors": [],
  "managementSuggestions": [],
  "followUp": [],
  "references": []
}
```

## 16.1 growthStatus

Allowed:

```text
normal
needs_attention
abnormal
```

MUST NOT 输出：

- 0-100 风险分
- 百分比风险
- 无依据精确评分

## 16.2 currentSituation

只描述当前已知事实。

事实 MUST 与输入数据一致。

## 16.3 concerns

列出当前值得关注的方面。

## 16.4 possibleFactors

列出可能影响因素。

MUST 使用不确定性表达，例如：

- 可能
- 可能相关
- 需要进一步观察

MUST NOT 把推测写成确定病害诊断。

## 16.5 managementSuggestions

给出可执行管理建议。

## 16.6 followUp

告诉用户下一步继续观察什么。

该字段 MUST 保留，因为农业业务具有：

```text
Analyze
↓
Act
↓
Observe Again
```

的连续过程。

## 16.7 references

农业知识引用。

---

# 17. AI Output Safety Boundary

AI MUST NOT：

- 伪造天气；
- 伪造土壤数据；
- 伪造用户未记录的生长指标；
- 输出无依据精确适宜度；
- 输出无依据病害概率；
- 将可能病害写成确诊；
- 无可靠依据生成精确农药剂量；
- 无可靠依据生成农药安全间隔期；
- 将预测能力假装成当前已实现功能。

如果信息不足，应明确：

> 当前缺少相关数据，无法从该方面进行判断。

---

# 18. AI Growth Analysis History

每次 AI Growth Analysis SHOULD 保存历史，并关联具体 Planting Profile。

历史语义应能够还原：

1. 当时的作物与阶段；
2. 当时用户观察；
3. 当时主要天气；
4. 当时主要趋势；
5. AI 输出；
6. 引用知识。

MUST NOT 因未来档案变化而改变过去分析含义。

MUST NOT 将以下内容升级为业务必须字段：

- modelVersion
- promptVersion
- tokenUsage
- knowledgeVersion
- durationMs

这些属于技术实现或观测，不属于当前农业业务。

---

# 19. Agriculture Lifecycle

```text
Create Land Profile
      ↓
Select Candidate Crop
      ↓
AI Planting Evaluation
      ↓
Decide to Plant
      ↓
Create Planting Profile
      ↓
Record Growth Metrics
      ↓
Observe Trends
      ↓
AI Growth Analysis
      ↓
Management Suggestions
      ↓
Continue Tracking
      ↓
Harvest / Finish Planting
```

---

# 20. Relationship with AI Q&A

Agriculture Domain 可向 AI Q&A 提供：

- Crop Information
- Agriculture Knowledge
- 必要农业档案上下文
- 必要生长趋势摘要

具体 Tool / Agent / Context 权限在 AI Q&A 需求中定义。

当前农业需求只定义：

> 农业模块必须能够沉淀可被 AI 问答复用的农业知识和农业上下文。

---

# 21. Explicit Non-Goals

Current V2 MUST NOT 主动实现：

```text
市场行情
模拟市场价格
产量预测
采摘时间预测
成熟时间预测
AI 病害确诊
病害概率
图片病害识别
农药精确剂量
农药安全间隔自动生成
IoT 设备接入
GIS 地块绘制
农机管理
农资库存
肥料库存
农药库存
成本核算
销售订单
仓储管理
财务管理
农业 ERP
农业 SaaS
复杂农业知识审核流程
农业知识版本治理平台
AI 模型版本业务追踪
Prompt 版本业务追踪
Token 使用统计业务化
```

如果用户后续明确提出，视为独立需求变更。

Agent MUST NOT 因“以后可能需要”而提前实现。

---

# 22. Future Extension Points

允许保留扩展点，但不得提前实现。

Example 1:

```text
Growth Metrics
+ Crop Knowledge
+ Variety
+ Weather
↓
Harvest Timing Prediction
```

Example 2:

```text
Growth Metrics
↓
Yield Prediction
```

Example 3:

```text
Crop Image
↓
Image Recognition
↓
Auxiliary Growth Analysis
```

Current V2 only:

```text
Archive
+
Record
+
Trend
+
Structured AI Analysis
+
Knowledge
```

---

# 23. Requirement Freeze

当前 V2 农业模块业务边界冻结为：

```text
Agriculture
│
├── Agriculture Archive
│   ├── Land Profile
│   └── Planting Profile
│
├── Crop Information
│
├── Agriculture Knowledge
│
├── AI Planting Evaluation
│   ├── Land Context
│   ├── Candidate Crop
│   ├── Knowledge Retrieval
│   └── Structured JSON Output
│
├── Crop Growth Metric Tracking
│   ├── Simple Numeric Metric
│   ├── Record
│   ├── History
│   └── Trend
│
└── AI Growth Analysis
    ├── Planting Context
    ├── User Observation
    ├── Weather Context
    ├── Growth Metric Context
    ├── Knowledge Retrieval
    ├── Structured JSON Output
    └── Analysis History
```

---

# 24. Agent Decision Rules

遇到不确定需求时，按以下顺序判断：

1. 是否属于当前六个农业业务能力之一？
2. 是否直接服务当前农业业务闭环？
3. 是否完成当前需求所必需？
4. 是否可以用更简单方案完成？
5. 是否属于未来扩展？
6. 是否正在把 Demo 做成农业 SaaS / ERP / IoT 平台？

如果第 5 或第 6 项成立，默认不实现。

最终原则：

> **只实现当前明确需求；保留扩展点，但不提前实现未来业务。**
