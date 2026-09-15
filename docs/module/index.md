# 智乡云业务模块注册表

本文只登记当前业务文档、实现状态和 Legacy 来源；行为与路由规则见根 [`AGENTS.md`](../../AGENTS.md)。

| Domain | Requirement | Design / Database | API Contract | Implementation | Legacy |
| --- | --- | --- | --- | --- | --- |
| `auth` | `NOT DEFINED` | `NOT DEFINED` | [`auth/api.md`](./auth/api.md) — 当前 Contract | `IMPLEMENTED`；验证状态按任务证据判断 | Express 旧资料仅在迁移任务中按需建立 |
| `agriculture` | [`agriculture/requirements.md`](./agriculture/requirements.md) | `NOT DEFINED` | `NOT DEFINED` | 新业务 `NOT IMPLEMENTED`；Nest 旧实现已冻结 | [`legacy/nest/agriculture/index.md`](./legacy/nest/agriculture/index.md) |
| `health` | [`health/requirements.md`](./health/requirements.md) | Domain Design `NOT DEFINED`；[`health/database.md`](./health/database.md) 为当前冻结 Database Design | [`health/api.md`](./health/api.md) — 当前冻结 Contract | 新业务 `NOT IMPLEMENTED`；Nest 旧实现已冻结 | [`legacy/nest/health/index.md`](./legacy/nest/health/index.md) |
| `ai` | [`ai/requirements.md`](./ai/requirements.md) | `NOT DEFINED` | `NOT DEFINED` | `NOT IMPLEMENTED` | 无已登记 Legacy 资料 |

功能状态含义见根 `AGENTS.md`。Legacy 默认不得读取，访问条件见 [`legacy/AGENTS.md`](./legacy/AGENTS.md)。
