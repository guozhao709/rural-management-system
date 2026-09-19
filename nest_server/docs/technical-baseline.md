# 智乡云 V2 后端技术基线

> 项目：智乡云 V2  
> 适用范围：V2 后端开发  
> 定位：后端技术选型、架构边界与 AI 实现方式的技术基线。业务语义、数据库设计和接口行为仍分别以模块的 Requirement、Design、Database Design、API 设计基线及严格 API Contract 为准。

## 目标与范围

后端采用 TypeScript 模块化单体，服务农业、健康和 AI Chat 三个核心业务。目标是保持模块清晰、可维护，体现结构化 AI、Agent 与 Tool Calling 的项目特色，并为合理扩展预留边界；不提前建设大规模生产平台或未来能力。

## 冻结技术选型

| 类型 | 技术 |
| --- | --- |
| Runtime / Language | Node.js、TypeScript |
| Backend / API | NestJS、REST |
| Persistence | PostgreSQL、MikroORM、Migrations |
| Validation | Zod；HTTP 层可使用现有的 class-validator、class-transformer、Joi |
| Authentication | JWT、Refresh Token Rotation |
| AI | LangChain.js、LangChain Chat Model、Zod Structured Validation |
| Agent / Tool | LangChain.js `createAgent()`、`tool()` |
| Realtime | AI Chat 优先 SSE；确有双向实时需要时使用 WebSocket |

核心组合为：`NestJS + TypeScript + PostgreSQL + MikroORM + LangChain.js + Zod`。

## 总体架构与模块边界

采用 **Modular Monolith（模块化单体）**：农业、健康、AI、聊天和基础能力在一个 NestJS 应用中运行，但保持职责边界。当前不采用微服务、消息队列驱动架构、分布式事务、服务注册发现或复杂事件总线。

推荐的组织仅表达职责，不要求机械对应目录：

```text
业务域：auth / users / admins / agriculture / health / chat
AI 编排：ai/model / ai/structured / ai/agent
外部能力：tools/weather
通用能力：common / infrastructure
```

农业与健康模块负责各自档案、指标、知识及专项分析的业务数据和规则；AI Chat 可经公开服务边界读取它们，不能绕过业务模块。业务模块不负责通用 LLM Provider、Agent 对话编排或第三方天气 API 的具体实现。

技术框架服务业务：不因 LangChain、PostgreSQL 或 NestJS 的能力而引入不必要的抽象。确定性结果必须优先由普通 TypeScript 计算，例如 BMI、均值/极值、健康或生长趋势及天气摘要统计；能确定性计算的结果不得交给 LLM 猜测。

## AI 实现边界

AI 分为两种不可混用的能力：

| 能力 | 适用场景 | 实现 |
| --- | --- | --- |
| Structured AI Analysis | 健康分析、种植评估、生长分析 | 固定输入与输出：`Context Builder → Prompt Builder → Chat Model → Structured Output → Zod Validation → Business Result` |
| AI Chat Agent | 多轮自然语言对话、按需读取数据/知识/天气 | `createAgent()` + 经校验的只读领域/知识/天气 Tool，输出自然语言或 Markdown |

固定 JSON 分析 **不得使用 Agent**，以降低不确定性、Token 消耗、输出漂移和调试成本。专项分析的 Context Builder 负责筛除无关字段、处理 null/unknown、汇总趋势和知识/天气上下文，并控制长度；Prompt Builder 负责提示词、业务规则、输出要求、安全边界与上下文注入，不负责数据库查询。

所有结构化 AI 输出必须先通过 Zod Schema 校验，失败必须明确处理；不得直接信任 LLM 输出。模型初始化集中在 LLM Provider 中，业务模块不得分散 `new SomeChatModel(...)`，以保留切换兼容模型供应商的边界。LangChain 是 AI 编排层，不是农业或健康业务框架。

当前 AI Chat 使用 `createAgent()`，不直接引入复杂 LangGraph StateGraph；仅在出现复杂审批、多 Agent、人工确认、长暂停恢复或工作流状态机需求时重新评估。

## Tool、会话与数据边界

Agent Tool 分为领域只读 Tool、知识 Tool 与外部 Tool：

- 领域只读 Tool：读取当前认证用户自己的健康/农业档案、指标和分析历史；
- 知识 Tool：检索健康知识、农业知识和作物信息；
- 外部 Tool：当前仅有 Weather Tool。

所有 Tool 输入必须用 Zod 校验。LangChain Tool 只是 Adapter，不能直接承载业务实现：例如 `WeatherAgentTool → WeatherService → 第三方天气 API`，领域读取 Tool 也必须通过对应业务服务。天气数据必须来自真实来源；失败应明确返回，不能模拟或伪造。未来的市场、政策、搜索、价格、IoT 或医疗外部 Tool 必须先具备明确业务需求和可靠数据源。

AI Chat 当前冻结为 **Read + Answer**：可读取领域数据、知识和天气，并生成回答；不得自动新增、修改或删除业务数据。若未来需要写操作，必须单独设计确认机制。

会话和消息以 PostgreSQL 为 Source of Truth。初期仅向 Agent 提供当前会话最近 N 条消息（例如 20–30 条）；长会话问题出现后才考虑“历史摘要 + 最近消息”，不提前建设复杂长期 Memory 或 Redis Agent Memory。

私有数据的唯一身份来源是当前认证用户；客户端和 Agent 都不得通过任意 `userId` 访问其他用户数据。认证使用 Access Token + Refresh Token Rotation；AI Agent 的用户上下文同样必须来自认证用户。

## 持久化、检索与通信

PostgreSQL 是主业务数据库，保存用户、管理员、农业/健康数据与知识、AI 分析历史、聊天会话和消息；不因 AI 引入新的主数据库。MikroORM 负责实体映射、Repository/EntityManager、Migration、事务及 PostgreSQL 访问。大量业务 SQL 不是默认方案，仅在 ORM 难以表达的局部统计或查询中使用。

知识检索先采用可控的关键词、分类、标签与作物关联：先生成检索条件、取少量 Top N 相关知识、再交给 Context Builder。不得把整个知识库放入 Prompt。知识规模和语义检索需求明确前，不默认引入 pgvector、embedding pipeline 或向量索引；Redis 也不是当前 AI 必选依赖，仅在缓存、限流、高频天气缓存或分布式状态有明确需求时评估。

主要 API 风格为 REST；专项 AI 分析仍经普通业务 API 调用。AI Chat 推荐 SSE 流式输出；如果实现成本需控制，可以先提供非流式版本。WebSocket 不是默认必需，仅在双向实时通信、在线客服或实时状态等明确场景使用。

## 安全、失败与观测

日志可记录 requestId、模块、操作、错误、耗时、模型名及必要的 Token 使用量；不得记录完整健康档案/敏感文本、完整农业私有数据、Access Token、Refresh Token 或 API Key。

AI 失败必须区分模型请求失败、结构化输出无效、Tool 调用失败、知识检索失败和天气不可用。失败或未知不等于安全、正常：不得在健康或农业分析失败时编造“风险较低”或“作物正常”等结论。所有 AI 能力都不得伪造天气、指标、档案、知识来源或市场行情；缺失数据必须明确为 unknown/unavailable。

## 当前不主动采用的技术

除非出现明确业务需求并重新评估，当前不主动引入：Microservices、Kafka、RabbitMQ、Event Sourcing、CQRS Framework、LangGraph StateGraph、Multi-Agent、向量数据库作为必选依赖、复杂 RAG Pipeline、Redis Agent Memory、MCP Server、Kubernetes 与分布式追踪平台。

## 最终原则

1. 业务优先，不为框架增加复杂度。
2. 固定 JSON 专项分析不用 Agent；只有 AI Chat 使用 Agent。
3. 确定性数据先由 TypeScript 计算，所有结构化 AI 输出均经 Zod 校验。
4. Agent 当前只读；Weather 是当前唯一外部 Tool。
5. 业务 Service 不与 LangChain 强耦合；PostgreSQL 是核心数据 Source of Truth。
6. 不默认采用 LangGraph、pgvector、Redis Agent Memory 或 MCP。
7. 缺失数据不得由 AI 伪造；保留扩展点，但不提前实现未来能力。

当前 V2 后端的结论为：**NestJS 模块化单体 + PostgreSQL/MikroORM 业务持久化 + Zod 数据契约 + LangChain.js AI 编排**；农业和健康专项 AI 使用结构化模型调用，AI Chat 使用 LangChain Agent，Weather 是当前唯一外部 Tool。
