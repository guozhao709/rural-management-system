# 智乡云业务模块注册表

本文是业务任务的统一路由入口。开始任何业务分析、设计、实现或验证前，先根据本表确认当前 Requirement、API Contract、Implementation State 和 Legacy Provenance。

## 状态规则

文档角色：

- `CURRENT_REQUIREMENT`：当前业务目标和边界；
- `CURRENT_CONTRACT`：当前 Frontend / Backend 跨边界接口；
- `CURRENT_DESIGN`：已批准的当前业务、领域及数据设计；
- `DRAFT_DESIGN`：正在分析、尚未批准为实现依据的设计；
- `LEGACY_NEST_REFERENCE`：Nest 旧业务资料；
- `LEGACY_EXPRESS_REFERENCE`：Express 旧业务资料；
- `HISTORICAL_RECORD`：历史 Prompt、进度、假设或验证记录。

Implementation State 使用根 `AGENTS.md` 定义的 `NOT IMPLEMENTED`、`PARTIAL`、`IMPLEMENTED`、`VERIFIED`、`BLOCKED`。

## Current Modules

| Domain | Current Requirement | Current Design | Current Contract | Current Implementation | Legacy Reference |
| --- | --- | --- | --- | --- | --- |
| `auth` | 当前行为由 Contract 与实现共同限定；独立 Requirement 尚未建立 | `NOT DEFINED` | [`auth/api.md`](./auth/api.md) — `CURRENT_CONTRACT` | `IMPLEMENTED`；实际验证状态按当前任务 Evidence 判断 | Express 旧业务资料仅在迁移任务中按需建立 |
| `agriculture` | [`agriculture/requirements.md`](./agriculture/requirements.md) — `CURRENT_REQUIREMENT` | `NOT DEFINED` | `NOT DEFINED` | 新业务 `NOT IMPLEMENTED`；现存前后端农业功能是冻结的 Nest 旧业务实现 | [`legacy/nest/agriculture/index.md`](./legacy/nest/agriculture/index.md) |
| `health` | [`health/requirements.md`](./health/requirements.md) — `CURRENT_REQUIREMENT` | `NOT DEFINED` | `NOT DEFINED` | 新业务 `NOT IMPLEMENTED`；现存前端 health 与后端 resident-health 是冻结的 Nest 旧业务实现 | [`legacy/nest/health/index.md`](./legacy/nest/health/index.md) |
| `ai` | [`ai/requirements.md`](./ai/requirements.md) — `CURRENT_REQUIREMENT` | `NOT DEFINED` | `NOT DEFINED` | `NOT IMPLEMENTED` | 仅在存在实际迁移材料时建立对应 legacy 路由 |

## Routing Rules

1. 当前 Requirement 高于 Legacy Reference 和 Existing Implementation。
2. Current Design 或 Current Contract 为 `NOT DEFINED` 时，不得根据旧方案、旧 API、旧 DTO 或现存 Route 自行推导新设计或接口。
3. 新农业和健康必须先形成 `DRAFT_DESIGN`，经开发者批准为 `CURRENT_DESIGN` 并建立 Contract 后，再实施 Frontend、Backend、Database 或 AI Integration。
4. Legacy 目录默认不得读取；适用条件见 [`legacy/AGENTS.md`](./legacy/AGENTS.md)。
5. 业务名称使用 `auth`、`agriculture`、`health`、`ai` 等语义化字符串。旧业务编号仅允许保留在历史归档和不可变 Migration 中。
6. 所有“旧业务”引用必须明确来源为 Nest 或 Express。

## Document Placement

- 跨 Frontend / Backend 的业务 Requirement、API Contract 和业务级设计放在 `docs/module/<domain>/`；其中当前模块设计入口使用 `design.md`，覆盖领域模型、业务流程和模块内数据设计。
- 仅属于 Nest 实现机制的 Backend 技术细节可放在 `nest_server/docs/`，但必须引用对应模块 Design，不得重新定义 Requirement、领域模型、数据语义或 Contract。
- Frontend-specific UI、组件、状态与工程规范继续放在 `nest_front/docs/`。
- Backend-specific 技术栈和当前实现规范继续放在 `nest_server/docs/`。
- 历史业务资料统一放在 `docs/module/legacy/<nest|express>/<domain>/`。
- 仅在有实际内容时创建文档，不为目录对称创建空文件。
