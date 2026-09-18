# Repository Agent Environment Profile

> 本文记录少量可重新发现的环境事实；行为规则见根 [`AGENTS.md`](../../AGENTS.md)，政策理由见 [`environment-decisions.md`](./environment-decisions.md)。

Last reviewed: 2026-09-15

## Repository Shape

- 当前应用：`nest_front/admin`、`nest_front/users`、`nest_server`。
- Legacy 只读路径：`front-end/`、`servers/`；其中 `servers/` 是 Express 旧项目。
- 当前应用使用根 pnpm workspace 和根 `pnpm-lock.yaml`，没有独立 Shared Package。
- 主要源码为 TypeScript 和 Vue SFC；具体技术版本以 Package Manifest、Lockfile 和正式技术栈文档为准。

## Canonical Entrypoints

- 安装、运行与验证命令：[`docs/development/index.md`](../development/index.md)。
- 业务模块状态：[`docs/module/index.md`](../module/index.md)。
- Frontend 技术与验证：`nest_front/docs/`。
- Backend 技术：`nest_server/docs/`。
- 环境配置来源：各应用 `.env.example` 与运行时配置校验代码；真实 `.env` 不作为文档来源。

## Current Business State

- `health` 已有当前冻结的 Requirement、Database Design 和 API Contract；新业务代码尚未据此完成替换。
- `agriculture`、`ai` 已有 Requirement，但 Design、Database Design 和 API Contract 尚未完整建立。
- 当前 Nest agriculture 实现仍是冻结的 Legacy 实现；Nest `resident-health` 运行时代码已移除。
- 旧健康数据库对象仍由历史 Migration 定义，待新健康实现阶段通过 replacement Migration 处理。

## Automation Facts

- 仓库内未配置 CI、Git hooks、Commit Convention、PR Template 或 Versioning Automation。
- 单元、组件、HTTP E2E 和 Browser E2E 的具体能力与限制由验证文档和现有配置定义。
- Backend mocked E2E 不等于真实 PostgreSQL、Migration 或外部服务验收。
- 远端 Branch Protection、Required Checks 和服务端 Hook 状态无法从仓库确认。
