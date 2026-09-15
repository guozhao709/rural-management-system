# Repository Agent Environment Decisions

> 仅记录有意的项目政策；可重新发现的事实见 [`environment-profile.md`](./environment-profile.md)。

Last reviewed: 2026-09-15

## Active Decisions

| ID | Decision | Rationale | Revisit when |
| --- | --- | --- | --- |
| DEC-002 | 根、Frontend、Backend 的正式 `docs/` 纳入版本控制，不由 `.gitignore` 忽略。 | 正式文档需要与实现一同审查。 | 文档迁移到具有等价审查能力的系统。 |
| DEC-003 | Skill 由开发者或 Agent Host 本机提供；批准范围由 `docs/skill-list/index.md` 管理。 | Skill 是执行指导，不是项目 Source of Truth。 | 需要离线、可复现的固定版本分发。 |
| DEC-004 | 业务文档以 `docs/module/<domain>/` 为中心：`requirements.md`、`design.md`、`database.md`、`api.md` 分别承载 Requirement、领域设计、数据库设计和 Contract。 | 业务语义跨越 Frontend、Backend、Database 与 AI；技术专属细节仍留在各自 `docs/`。 | 文档迁移到具有等价路由和生命周期能力的系统。 |
| DEC-005 | 当前业务使用语义化 Domain 名；`Mxx` 只保留在 Legacy 历史和不可变 Migration 中。 | 降低跨层歧义，同时保留审计连续性。 | 不再需要旧数据库或历史证据。 |
| DEC-006 | 所有旧业务明确区分 Nest 或 Express；现存 Nest 农业、健康实现冻结。仅允许明确替换/迁移，或经授权的安全、数据损坏、迁移阻塞修复。 | 避免旧模型继续扩张并污染新业务。 | 新业务完成切换并批准 Legacy 退役策略。 |
| DEC-007 | Agent 可执行根 `AGENTS.md` 列出的只读 Git 检查；任何 Git 写操作仍需用户针对具体操作明确授权。 | 支持可靠识别现有修改，同时保留版本控制权。 | 团队建立新的 Git/PR 自动化政策。 |

## Superseded

- DEC-001：API Contract 使用 `docs/接口文档/`；已由 DEC-004 取代。
