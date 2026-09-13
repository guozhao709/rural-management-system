# Repository Agent Environment Decisions

> 本文只记录有意的项目环境政策；可重新发现的仓库事实见 `environment-profile.md`。

Last reviewed: 2026-09-13

## DEC-001 — API Contract 使用现有中文目录

- **Status:** Superseded by DEC-004
- **Scope:** repository
- **Decision:** `docs/接口文档/` 是 Frontend 与 Backend 跨边界 API Contract 的唯一规范路径。
- **Rationale:** 现有 M01、M08、M09 Contract 已在该目录维护，保留它可以避免无收益的路径迁移。
- **Consequences:** Agent 和文档不得引用不存在的 `docs/api/`；Contract Change 必须同时检查 Provider 与 Consumer。
- **Revisit when:** 团队明确决定统一迁移文档目录命名，并能一次性更新所有引用。

## DEC-002 — 正式文档纳入版本控制

- **Status:** Accepted
- **Scope:** repository and all `docs/` directories
- **Decision:** 根、Frontend 与 Backend 的 `docs/` 均纳入版本控制，不得由 `.gitignore` 忽略。
- **Rationale:** 项目已将这些文档定义为 Architecture、Design、API Contract 和验证规则的 Source of Truth。
- **Consequences:** 新增正式文档应随对应变更一同审查；历史笔记或临时输出不得冒充正式文档。
- **Revisit when:** 文档存储迁移到具有等价审查与版本能力的独立系统。

## DEC-003 — Skill 实现由本机提供

- **Status:** Accepted
- **Scope:** repository agent tooling
- **Decision:** `.agents/` 中的 Skill 实现由开发者或 Agent Host 在本机安装，不随仓库版本控制；`docs/skill-list/index.md` 记录项目批准范围。
- **Rationale:** Skill 是执行指导而非项目 Source of Truth，避免在仓库中复制外部 Skill 包。
- **Consequences:** 执行前检查所需 Skill 是否可用；缺失时明确报告，不得伪造使用结果。`.agents/` 保持在 `.gitignore` 中。
- **Revisit when:** 团队需要离线、可复现或固定版本的 Skill 分发机制。

## DEC-004 — 业务模块文档以 Domain 为中心

- **Status:** Accepted
- **Scope:** repository business documentation
- **Decision:** `docs/module/index.md` 是业务任务统一入口；当前 Requirement、业务/领域/数据 Design 与 API Contract 分别位于 `docs/module/<domain>/requirements.md`、`docs/module/<domain>/design.md` 和 `docs/module/<domain>/api.md`。
- **Rationale:** 业务模块同时跨越 Frontend、Backend、Database 与 AI，不应由 Backend 目录或独立接口目录单方面承载。
- **Consequences:** Current Design 或 Contract 不存在时不得从 Existing Implementation、legacy 方案或 legacy API 推导；Frontend 与 Backend 专属技术规范仍留在各自 `docs/`，且不得重新定义跨边界业务语义。
- **Revisit when:** 文档迁移到具有同等路由、审查和生命周期表达能力的独立系统。

## DEC-005 — 使用语义化 Domain 名并保留历史证据

- **Status:** Accepted
- **Scope:** business naming and historical records
- **Decision:** 当前业务使用 `auth`、`agriculture`、`health`、`ai` 等语义化名称；`M01`、`M07`、`M08`、`M09` 等编号只允许保留在 legacy 历史正文、历史任务记录和不可变 Migration 中。
- **Rationale:** 语义名称降低跨层沟通歧义，同时保留不可变历史标识可维护迁移与审计连续性。
- **Consequences:** 当前路径、Contract、新增代码与新任务不得继续使用旧编号；不得为了改名重写已执行 Migration。
- **Revisit when:** 不再需要保留旧数据库或历史审计证据。

## DEC-006 — 明确区分并冻结 Legacy 实现

- **Status:** Accepted
- **Scope:** Nest and Express legacy business
- **Decision:** 所有旧业务必须明确标注为 Nest 旧业务或 Express 旧业务。现存 Nest 农业和健康实现冻结功能开发，只允许明确授权的替换工作，以及用户明确授权的安全、数据损坏或迁移阻塞修复。
- **Rationale:** 新农业和健康业务将重新设计，继续增量扩展旧实现会制造错误复用和迁移负担。
- **Consequences:** Legacy 文档默认不读取；Existing Legacy Implementation 只能作为迁移 Evidence，不能覆盖 Current Requirement。
- **Revisit when:** 对应新业务完成切换且 legacy 实现可以按批准的数据与兼容策略退役。
