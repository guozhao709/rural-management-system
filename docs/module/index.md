# 智乡云业务模块注册表

本文只登记当前业务文档、实现状态和 Legacy 来源；行为与路由规则见根 [`AGENTS.md`](../../AGENTS.md)。

| Domain | Requirement | Design / Database | API 设计基线 | 严格 API Contract | Implementation | Legacy |
| --- | --- | --- | --- | --- | --- |
| `auth` | `NOT DEFINED` | `NOT DEFINED` | [`auth/api.md`](./auth/api.md) | `NOT GENERATED` | `IMPLEMENTED`；验证状态按任务证据判断 | Express 旧资料仅在迁移任务中按需建立 |
| `agriculture` | [`agriculture/requirements.md`](./agriculture/requirements.md) | `NOT DEFINED` | [`agriculture/api.md`](./agriculture/api.md) | `NOT GENERATED` | 新业务 `NOT IMPLEMENTED`；Nest 旧实现已冻结 | [`legacy/nest/agriculture/index.md`](./legacy/nest/agriculture/index.md) |
| `health` | [`health/requirements.md`](./health/requirements.md) | Domain Design `NOT DEFINED`；[`health/database.md`](./health/database.md) 为当前冻结 Database Design | [`health/api.md`](./health/api.md) — 当前冻结基线 | [`health/api-contract.md`](./health/api-contract.md) — 基于当前已验证 Backend 的严格 Contract | 新业务 `PARTIAL`：Backend 与本地数据库迁移已实施，Frontend、健康知识管理入口与业务专项验收待完成；Nest 旧运行时实现已移除 | [`legacy/nest/health/index.md`](./legacy/nest/health/index.md) |
| `ai` | [`ai/requirements.md`](./ai/requirements.md) | `NOT DEFINED` | `NOT DEFINED` | `NOT GENERATED` | `NOT IMPLEMENTED` | 无已登记 Legacy 资料 |

`api.md` 是设计基线；Backend 完成并验证后，依据实际行为生成同目录的 `api-contract.md`，供严格跨应用集成使用。功能状态含义见根 `AGENTS.md`。Legacy 默认不得读取，访问条件见 [`legacy/AGENTS.md`](./legacy/AGENTS.md)。
