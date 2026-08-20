# AI 基础设施边界

此目录预留给未来的 LangChain.js Provider、模型客户端、结构化输出与工具运行时配置。

当前阶段只安装 `langchain`、`@langchain/core` 与 `zod`，并通过 `LLM_*` 环境变量预留配置。这里没有 Agent、Tool、Chain、模型调用或业务 Prompt。普通业务 Service 不应直接依赖 LangChain。
