# AI 聊天模块需求（Agent 版）

> Project: 智乡云  
> Document Role: CURRENT_REQUIREMENT  
> Domain: AI Chat / Agent  
> Status: V2 Business Requirement Baseline  
> Project Level: Competition / Demo  
> Scope: BUSINESS REQUIREMENTS ONLY  
> This document is a Source of Truth for the AI Chat domain.

---

# 0. Agent Instructions

AI Chat 是智乡云的统一自然语言入口，不是新的农业或健康业务系统。

所有设计与实现 MUST 遵守：

1. MUST 以本文档为业务边界。
2. MUST NOT 重复建设农业、健康已有业务能力。
3. MUST NOT 把 AI Chat 扩展成通用自动化 Agent 平台。
4. MUST NOT 因“Agent 最佳实践”而主动创建大量无真实业务价值的 Tool。
5. Current V2 MUST 以 Read + Answer 为主。
6. Current V2 MUST NOT 直接修改农业或健康业务数据。
7. MUST 按当前登录用户进行私人上下文隔离。
8. MUST 继承农业与健康模块已经定义的业务边界。
9. MUST NOT 自动将聊天消息写入业务档案。
10. Tool Set 当前只有 Weather Tool。
11. 新增 Tool 属于需求变更。
12. AI Chat 输出以自然语言 / Markdown 为主，不应被改造成统一结构化业务 JSON。
13. Agriculture / Health 专项 AI 分析仍使用各自固定结构化 JSON；AI Chat 不替代这些专项接口。
14. MUST NOT 为了“更智能”而主动提升项目复杂度。

---

# 1. Domain Definition

AI Chat 是智乡云三个核心业务之一：

- Agriculture
- Health
- AI Chat

AI Chat 的业务职责：

> 理解用户自然语言问题，按需读取用户农业 / 健康上下文、访问领域知识，并在必要时调用工具，然后返回自然语言结果。

AI Chat MUST NOT 被定义为：

- 新的健康分析系统
- 新的农业分析系统
- 通用自动化平台
- 业务数据写入机器人
- 无边界通用 Agent

---

# 2. Current Scope

V2 AI Chat 只包含：

```text
AI Chat
├── Conversation
├── User Context Access
│   ├── Health Context
│   └── Agriculture Context
├── Knowledge Access
│   ├── Health Knowledge
│   ├── Agriculture Knowledge
│   └── Crop Information
└── Tool Set
    └── Weather Tool
```

---

# 3. Conversation

## 3.1 Required Capabilities

Current V2 SHOULD 支持：

- 新建会话
- 多轮对话
- 历史会话
- 历史消息
- 清空 / 结束当前会话

## 3.2 Multi-turn Context

Agent MUST 能理解当前会话中的指代与连续语义。

Example:

```text
User:
我最近血压怎么样？

Assistant:
...

User:
那我最近应该注意什么？
```

第二轮 MUST 能理解“那”仍指向上一轮血压话题。

## 3.3 Conversation Data Boundary

聊天内容属于 Conversation Context。

聊天内容 MUST NOT 自动写入：

- Health Profile
- Health Metrics
- Land Profile
- Planting Profile
- Growth Metrics

Rule:

> Conversation Context != Business Record

---

# 4. User Input

AI Chat 用户主动输入：

```text
Natural Language Message
```

System automatically provides:

- current authenticated user
- current conversation context

AI Chat MUST NOT 要求用户先选择固定业务表单。

---

# 5. Output

AI Chat SHOULD 输出：

```text
Natural Language / Markdown
```

可使用：

- headings
- paragraphs
- lists
- emphasis

AI Chat MUST NOT 因统一技术规范而强制转成固定业务 JSON。

Structured JSON belongs to domain-specific AI functions such as:

- AI Health Analysis
- AI Planting Evaluation
- AI Growth Analysis

---

# 6. Health Context Access

Agent MAY 读取当前用户自己的：

- Health Profile
- Health Metrics
- Health Metric Trends
- AI Health Analysis History

Agent MAY 访问公共：

- Health Knowledge

Agent MUST NOT 读取其他用户健康数据。

Example:

```text
User:
我最近血压怎么样？

Agent:
Read current user's BP metrics
→ Read trend
→ Answer
```

---

# 7. Agriculture Context Access

Agent MAY 读取当前用户自己的：

- Land Profiles
- Planting Profiles
- Growth Metrics
- Growth Trends
- AI Planting Evaluation History
- AI Growth Analysis History

Agent MAY 访问公共：

- Crop Information
- Agriculture Knowledge

Agent MUST NOT 读取其他用户农业私人数据。

---

# 8. Public Knowledge

公共知识包括：

```text
Health Knowledge
Agriculture Knowledge
Crop Information
```

Agent SHOULD 在相关领域问题中优先利用项目已有知识。

Agent MUST NOT 将无来源 AI 自由生成内容自动当成项目知识库事实。

---

# 9. Tool Set

## 9.1 Definition

Tool Set 提供：

> 实时获取或外部调用能力。

Current V2:

```text
Tool Set
└── Weather Tool
```

Current V2 MUST NOT 主动增加：

- Market Tool
- Policy Tool
- Search Tool
- Price Tool
- IoT Tool
- Other Tools

除非需求文档明确新增。

---

# 10. Weather Tool

Weather Tool 用于获取真实天气。

May support:

- current weather
- recent weather
- short-term forecast

Agent SHOULD 按需调用。

Example:

```text
User:
明天我的番茄需要注意什么？

Agent:
Read planting context
+ Call Weather Tool
+ Read agriculture knowledge
→ Answer
```

Weather Rules:

- MUST use real data
- MUST NOT fabricate current weather
- MUST NOT simulate live weather
- if unavailable, MUST explicitly state unavailable

---

# 11. Context vs Tool

Business semantics SHOULD distinguish:

```text
Agent
│
├── User Context
│   ├── Health
│   └── Agriculture
│
├── Knowledge
│   ├── Health
│   ├── Agriculture
│   └── Crop
│
└── Tools
    └── Weather
```

Technical implementation MAY wrap some context access as tools, but business requirements MUST NOT be rewritten around technical Tool abstractions.

---

# 12. Read-only Agent Boundary

Current V2 Agent MUST be read-only for user business data.

Allowed:

```text
READ Health Profile
READ Health Metrics
READ Health Analysis History
READ Land Profile
READ Planting Profile
READ Growth Metrics
READ Agriculture Analysis History
READ Knowledge
CALL Weather Tool
ANSWER
```

Not allowed:

```text
CREATE Health Metric
UPDATE Health Profile
DELETE Health Data
CREATE Land Profile
UPDATE Land Profile
CREATE Planting Profile
UPDATE Planting Profile
DELETE Agriculture Data
```

If user asks:

> 帮我记录血压 120/80

Current V2 SHOULD explain that the user needs to use the corresponding health recording function.

Agent MUST NOT silently perform the write.

---

# 13. No Automatic Record Mutation

Example:

```text
User:
我最近睡得不好。
```

MUST NOT automatically update:

```text
Health Profile.sleep = bad
```

Example:

```text
User:
我准备种番茄。
```

MUST NOT automatically create:

```text
Planting Profile
```

Explicit business operations remain outside current AI Chat.

---

# 14. Health Safety Inheritance

AI Chat MUST inherit all Health Domain constraints.

Health-related AI Chat MUST NOT:

- diagnose disease
- output disease probability
- recommend prescription medication
- provide prescription dosage
- fabricate health data
- bypass missing data

If data is missing:

Correct:

> 当前没有近期血压记录，因此无法判断最近血压变化。

Incorrect:

> 你的血压最近正常。

---

# 15. Agriculture Safety Inheritance

AI Chat MUST inherit Agriculture Domain constraints.

Agriculture-related AI Chat MUST NOT:

- fabricate weather
- fabricate growth metric data
- output unsupported exact suitability scores
- output unsupported disease probability
- present possible disease as confirmed disease
- generate precise pesticide dosage without reliable support
- pretend prediction capabilities exist when they do not

Example:

Current V2 MUST NOT predict an exact best harvest date from crop length trend if Harvest Timing Prediction is not implemented.

---

# 16. Typical Flow: Health

```text
User:
我最近体重变化怎么样？

Agent:
Read current user's weight metrics
→ Read deterministic trend
→ Answer
```

---

# 17. Typical Flow: Health + Knowledge

```text
User:
最近老头晕，结合我的数据帮我看看。

Agent:
Read Health Profile
+ Read recent Health Metrics
+ Read Health Knowledge
→ Answer
```

Agent MAY reference previous AI Health Analysis if useful.

---

# 18. Typical Flow: Agriculture

```text
User:
我的豇豆最近长得怎么样？

Agent:
Read Planting Profile
+ Read Growth Metrics
→ Answer
```

---

# 19. Typical Flow: Agriculture + Weather

```text
User:
明天我的番茄需要注意什么？

Agent:
Read Planting Profile
+ Call Weather Tool
+ Read Agriculture Knowledge
→ Answer
```

---

# 20. Typical Flow: Weather

```text
User:
明天长安区天气怎么样？

Agent:
Call Weather Tool
→ Answer
```

---

# 21. Permission Boundary

Private data:

```text
Health Profile
Health Metrics
Health Analysis History
Land Profile
Planting Profile
Growth Metrics
Agriculture Analysis History
```

MUST be scoped to:

```text
Current Authenticated User
```

Public data:

```text
Health Knowledge
Agriculture Knowledge
Crop Information
Weather
```

No client-provided arbitrary userId may override the authenticated user's identity for private context access.

---

# 22. Explicit Non-Goals

Current V2 MUST NOT implement:

```text
Agent write actions
automatic profile mutation
automatic metric creation
automatic land creation
automatic planting creation
automatic deletion
workflow automation
general-purpose autonomous agent
market tool
policy tool
search engine tool
price tool
medical external tools
IoT tools
fake demo tools
background autonomous work
unconfirmed high-risk actions
automatic conversation-to-record extraction
```

---

# 23. Future Extension Points

Future Tool Set MAY become:

```text
Tool Set
├── Weather Tool
├── Market Tool
├── Policy Tool
└── ...
```

Only when:

1. real data source exists;
2. user value is clear;
3. requirement is explicitly added.

Future Agent MAY evolve from:

```text
Read + Answer
```

to:

```text
Read + Answer + Confirmed Action
```

But writing requires separate requirements for:

- user confirmation
- permissions
- success/failure feedback
- rollback / correction strategy

Current V2 MUST NOT implement these.

---

# 24. Requirement Freeze

Current V2 AI Chat is frozen as:

```text
AI Chat
│
├── Conversation
│   ├── New Conversation
│   ├── Multi-turn Chat
│   ├── Conversation History
│   └── Message History
│
├── User Context Access
│   ├── Health Context
│   └── Agriculture Context
│
├── Knowledge Access
│   ├── Health Knowledge
│   ├── Agriculture Knowledge
│   └── Crop Information
│
└── Tool Set
    └── Weather Tool
```

Core behavior:

```text
Natural Language Message
      ↓
Understand Intent
      ↓
Read Required Context
      ↓
Read Required Knowledge
      ↓
Call Weather Tool if needed
      ↓
Use Conversation Context
      ↓
Natural Language / Markdown Answer
```

---

# 25. Agent Decision Rules

When uncertain, decide in this order:

1. Is this a natural-language access need for existing Agriculture / Health capabilities?
2. Does the answer require user context?
3. Does it require project knowledge?
4. Does it require real-time weather?
5. Can the task be answered read-only?
6. Is the request trying to write or mutate business data?
7. Is a new Tool being invented only to make the Agent look more complex?
8. Would the design bypass Agriculture / Health boundaries?

Rules:

- If #6 is true → do not perform write action in V2.
- If #7 is true → do not add the Tool.
- If #8 is true → domain boundary wins.

Final principle:

> **AI Chat is a read-only natural-language access layer over existing domain data, knowledge, and the current Weather Tool—not a second business system.**
