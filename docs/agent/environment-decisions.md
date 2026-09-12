# Repository Agent Environment Decisions

> 本文只记录有意的项目环境政策；可重新发现的仓库事实见 `environment-profile.md`。

Last reviewed: 2026-09-12

## DEC-001 — API Contract 使用现有中文目录

- **Status:** Accepted
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
