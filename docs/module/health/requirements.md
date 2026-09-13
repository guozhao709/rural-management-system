# 健康模块需求（Agent 版）

> Project: 智乡云  
> Document Role: CURRENT_REQUIREMENT  
> Domain: Health  
> Status: V2 Business Requirement Baseline  
> Project Level: Competition / Demo  
> Scope: BUSINESS REQUIREMENTS ONLY  
> This document is a Source of Truth for the health domain.

---

# 0. Agent Instructions

本项目不是正式医疗产品，也不是大规模商业生产系统。

Agent 在分析、设计或实现健康模块时，必须遵守以下原则：

1. MUST 以本文档定义的业务需求为准。
2. MUST NOT 将健康模块擅自扩展为医疗诊断系统。
3. MUST NOT 因“生产最佳实践”“医疗合规”“企业级架构”等理由主动增加未定义业务。
4. MUST NOT 主动引入复杂临床规则、医疗审核、专业分诊、医疗级审计、复杂授权、数据治理平台。
5. MUST 优先保证业务闭环、用户体验、可演示性和代码可维护性。
6. SHOULD 为明确的未来扩展保留合理空间，但 MUST NOT 提前实现未来业务。
7. 当本文档未定义某项业务时，Agent SHOULD 保持最小实现，不能自行补全成复杂系统。
8. 不得把技术实现细节反向升级为业务需求。
9. 后续数据库、API、前端 UI 的设计不得改变本文档的核心业务边界；如需改变，必须先修改需求文档。
10. 本文档中“当前版本不做”的内容属于明确禁止主动实现的范围。

---

# 1. Domain Definition

健康模块是智乡云三个核心业务之一：

- 农业
- 健康
- AI 问答

健康模块的业务目标：

> 通过“健康档案 + 健康指标跟踪 + 健康知识”持续积累用户健康上下文，并通过 AI 对用户当前身体情况进行辅助分析和生活建议。

健康模块 MUST NOT 被定义为：

- 医疗诊断系统
- 医院信息系统
- 电子病历系统
- 临床决策系统
- 专业医疗分诊系统
- 处方推荐系统

---

# 2. Current Scope

V2 健康模块只包含以下四个一级业务能力：

```text
Health
├── Health Profile
├── Health Metric Tracking
├── AI Health Analysis
└── Health Knowledge
```

任何新增一级业务能力均视为需求变更。

---

# 3. Health Profile

## 3.1 Purpose

Health Profile 用于保存用户相对稳定的健康背景信息。

主要目的：

- 避免 AI 健康分析时重复填写；
- 为健康分析提供用户上下文。

## 3.2 Required Business Categories

### Basic Body Information

可包含：

- 性别
- 出生日期 / 年龄
- 身高

体重 SHOULD 作为健康指标记录，而不是只作为固定档案数据。

### Lifestyle

可包含：

- 吸烟情况
- 饮酒情况
- 运动情况
- 睡眠情况

### Basic Health Background

可包含：

- 用户主动填写的既往健康情况
- 过敏情况

## 3.3 Rules

- Profile MUST 支持部分填写。
- 缺少某些档案数据 MUST NOT 阻止用户进行 AI 健康分析。
- 未知数据 MUST 被视为 unknown。
- Agent / AI MUST NOT 猜测用户未提供的健康信息。
- 当前版本 MUST NOT 引入医学编码体系。

---

# 4. Health Metric Tracking

## 4.1 Purpose

允许用户持续或阶段性记录健康指标，并观察变化趋势。

该能力同时为 AI 健康分析提供结构化健康上下文。

## 4.2 System Preset Metrics

当前版本至少包含：

- 体重
- 血压
- 心率
- 体温

## 4.3 Required Capabilities

用户 SHOULD 能够：

- 添加指标记录；
- 查看历史记录；
- 删除错误记录；
- 按时间查看数据；
- 查看趋势图。

## 4.4 Custom Metric Template

用户 MAY 创建简单的自定义健康指标模板。

典型业务示例：

```text
名称：发烧期间体温
指标：体温
单位：℃
```

随后用户记录：

```text
38.5
39.0
38.2
37.8
```

系统展示时间趋势。

## 4.5 Custom Metric Constraints

当前版本的自定义指标：

- SHOULD 以简单数值记录为主；
- SHOULD 支持趋势图；
- MUST NOT 演化为通用低代码表单系统；
- MUST NOT 提供复杂字段编排；
- MUST NOT 提供自定义统计公式；
- MUST NOT 提供任意图表配置平台。

## 4.6 Tracking Modes

业务上允许两种使用模式：

### Long-term Tracking

例如：

- 体重
- 血压
- 心率

### Temporary / Stage Tracking

例如：

- 发烧期间体温
- 某阶段静息心率
- 某阶段睡眠时长

当前版本仅实现“记录 + 趋势观察”，不建设专项健康管理工作流。

---

# 5. AI Health Analysis

## 5.1 Core Principle

AI 健康分析 MUST 遵循：

> 用户输入“这一次发生了什么”；系统自动补充“系统已经知道什么”。

用户不应每次重复填写已有健康档案和健康指标。

---

# 6. User Input for One Analysis

一次健康分析的用户主动输入限制为以下四类。

## 6.1 Symptoms

采用：

- 常见症状快速选择
- 自由补充

初始常见症状可包括：

- 头晕
- 头痛
- 乏力
- 发热
- 怕冷
- 咳嗽
- 咽痛
- 呼吸不适
- 胸闷
- 心慌
- 恶心
- 腹痛
- 腹泻
- 食欲不振
- 失眠
- 嗜睡
- 其他

MUST NOT 引入：

- ICD
- 临床术语本体
- 医学疾病编码体系

## 6.2 Severity

当前业务只需要：

- 轻微
- 一般
- 明显

MUST NOT 擅自扩展复杂临床评分量表。

## 6.3 Duration

建议业务选项：

- 今天刚出现
- 1～3 天
- 4～7 天
- 一周以上
- 反复出现

MUST NOT 强制用户填写精确医学时间线。

## 6.4 Free Description

用户可以自由描述本次身体情况。

自由文本用于表达固定选项无法覆盖的信息。

---

# 7. System Context Used by AI Health Analysis

AI 健康分析 SHOULD 自动组合以下信息。

## 7.1 Health Profile

可读取：

- 年龄
- 性别
- 身高
- 生活习惯
- 基础健康背景
- 过敏情况

缺失数据 MUST 标记为未知，不得补造。

## 7.2 Recent Health Metrics

可读取：

- 最近体重
- 最近血压
- 最近心率
- 最近体温
- 与当前情况相关的用户自定义指标

SHOULD 同时提供有意义的近期变化摘要。

## 7.3 Deterministic Calculation

能够通过普通代码确定的结果 MUST 优先由确定性逻辑计算，不交给 LLM 自由判断。

例如：

- BMI
- 体重变化
- 平均值
- 最大值
- 最小值
- 简单上升趋势
- 简单下降趋势
- 简单稳定趋势

Rule:

> Deterministic facts MUST be computed before LLM reasoning.

## 7.4 Health Knowledge

AI 健康分析 SHOULD 检索与本次情况相关的健康知识。

健康知识 SHOULD 作为 AI 分析的参考上下文。

AI MUST NOT 仅依赖模型自由发挥生成事实性健康知识。

---

# 8. AI Health Analysis Output

输出业务结构 MUST 固定为以下内容。

## 8.1 Summary

健康概况。

作用：

- 汇总当前症状；
- 汇总已有健康指标；
- 描述值得注意的整体情况。

MUST NOT 输出疾病确诊。

## 8.2 Concerns

需要关注。

SHOULD 尽量基于用户真实数据，例如：

- 最近血压偏高；
- 指标近期上升；
- 症状持续数日；
- 睡眠较少。

## 8.3 Factors

可能影响因素。

只能描述“可能相关”，不能定义为确定病因。

Example:

- 睡眠不足可能影响精神状态；
- 近期劳累可能与乏力有关。

MUST NOT 表述为：

> “你的症状就是由 X 疾病导致。”

## 8.4 Suggestions

日常建议。

要求：

- 普通用户可理解；
- 可执行；
- 以生活方式、观察、记录为主。

## 8.5 Medical Advice

就医提示。

作用：

- 说明何时不应继续只依赖 AI；
- 提醒用户考虑寻求专业医疗帮助。

MUST NOT 演变成正式临床分诊体系。

禁止主动设计：

- emergency
- urgent
- routine
- self-care

等专业分诊等级系统。

## 8.6 References

可以展示本次分析使用的健康知识及其来源。

SHOULD 支持用户进一步查看相关知识内容。

---

# 9. AI Safety Boundary

AI Health Analysis MUST NOT 输出：

- 疾病确诊；
- 疾病发生概率；
- “你有 XX% 概率患某病”；
- 处方药推荐；
- 具体处方药剂量；
- 将 AI 建议表述为医生诊断；
- 编造不存在的用户健康数据。

如果缺少某项数据：

正确：

> 当前没有近期血压记录，因此无法从血压变化方面进行分析。

错误：

> 你的血压目前正常。

---

# 10. Health Analysis History

每次 AI 健康分析 SHOULD 保存历史。

历史业务语义必须能够还原：

1. 用户当时输入的信息；
2. 当时系统使用的主要健康上下文；
3. 当时生成的 AI 分析结果。

原因：

用户未来修改档案或新增指标时，不应改变过去分析的历史语义。

历史记录：

- 用于用户回顾；
- MUST NOT 被描述为正式电子病历。

---

# 11. Health Knowledge

## 11.1 Purpose

健康知识同时服务：

- 用户直接浏览；
- AI 健康分析；
- AI 问答。

## 11.2 User Capabilities

用户 SHOULD 能：

- 浏览；
- 搜索；
- 查看详情；
- 从 AI 分析跳转到相关知识。

## 11.3 Content

例如：

- 如何正确测量血压；
- BMI 是什么；
- 如何改善睡眠；
- 高盐饮食的影响；
- 日常运动建议。

## 11.4 Source Requirement

健康知识 SHOULD 包含明确来源，例如：

- 来源机构
- 来源链接

MUST NOT 将无来源的 AI 自动生成文本直接视为可信健康知识。

---

# 12. Relationship with AI Q&A

健康是独立业务域，同时为 AI 问答提供能力。

Health Domain 可向 AI Q&A 提供：

- 健康知识；
- 健康指标摘要；
- 健康档案上下文；
- 必要的健康趋势摘要。

具体 Tool / Agent / 调用方式属于后续 AI 问答需求或技术设计。

本需求文档只定义：

> 健康模块必须能够沉淀可供 AI 问答使用的健康上下文和健康知识。

---

# 13. Explicit Non-Goals

以下内容在当前 V2 中 MUST NOT 主动实现：

```text
疾病确诊
疾病概率预测
处方药推荐
具体药物剂量
临床分诊系统
专业医疗规则引擎
医生审核工作流
临床知识审核平台
医疗知识复杂版本治理
健康访问审计平台
复杂健康授权 Scope
医疗设备接入
智能穿戴设备同步
电子病历
实验室检查报告管理
医学量表平台
体重专项管理
血压专项管理
睡眠专项管理
运动专项管理
饮食与热量管理
```

如果后续用户明确提出其中某项，则视为独立需求变更。

Agent MUST NOT 因“未来可能需要”而提前实现。

---

# 14. Future Extension Points

允许保留未来扩展方向，但不得提前实现。

例如：

```text
Health Metric
    ↓
Weight Management

Health Metric
    ↓
Blood Pressure Management

Health Metric
    ↓
Sleep Management

Health Metric
    ↓
Exercise Management
```

Current V2:

```text
Record
+
History
+
Trend
```

Future:

```text
Goal
+
Plan
+
Specialized Analysis
+
AI Coaching
```

未来能力只能在明确需求出现后新增。

---

# 15. Business Flow

```text
Health Profile
      ↓
Health Metric Tracking
      ↓
Personal Health Context
      ↓
User Starts AI Health Analysis
      ↓
User Input:
Symptoms
+ Severity
+ Duration
+ Free Description
      ↓
System Context:
Health Profile
+ Recent Metrics
+ Trend Summary
+ Health Knowledge
      ↓
AI Output:
Summary
+ Concerns
+ Possible Factors
+ Suggestions
+ Medical Advice
+ References
      ↓
Save Analysis History
      ↓
Continue Health Tracking
```

---

# 16. Requirement Freeze

当前 V2 健康模块业务边界冻结为：

```text
Health
│
├── Health Profile
│   ├── Basic Body Information
│   ├── Lifestyle
│   └── Basic Health Background
│
├── Health Metric Tracking
│   ├── Preset Metrics
│   ├── Custom Metrics
│   ├── Metric History
│   └── Trend Visualization
│
├── AI Health Analysis
│   ├── Current Condition Input
│   ├── Automatic Context Loading
│   ├── Health Knowledge Retrieval
│   ├── Structured Analysis
│   └── Analysis History
│
└── Health Knowledge
    ├── Browse
    ├── Search
    ├── Detail
    └── Verifiable Sources
```

---

# 17. Decision Rules for Agent

当 Agent 遇到不确定需求时，按以下优先级决策：

1. 是否属于本文档四个一级业务之一？
2. 是否直接服务当前用户业务闭环？
3. 是否是完成当前需求所必需？
4. 是否可以使用更简单的方案完成？
5. 是否属于明确的未来扩展？
6. 是否正在把 Demo 做成生产级医疗系统？

如果第 5 或第 6 项成立，默认不实现。

最终原则：

> **只实现当前明确需求；保留扩展点，但不提前实现未来业务。**
