# Project-approved Skills

本清单定义项目允许 Agent 自动选择的已安装 Skill。每个 Skill 只承担一个主要职责；未列入的 Skill 不自动选择，除非当前 Requirement 明确要求或更高优先级指令要求。

Skill 实现由每位开发者或 Agent Host 在本机安装，仓库不版本化 `.agents/`。本清单是项目批准范围的 Source of Truth，但不代表当前机器一定已安装对应 Skill；执行前应检查可用性，缺失时按根 `AGENTS.md` 报告，不得伪造使用结果。

## Workflow

| Skill | 主要职责 | Use When | Do Not Use When |
| --- | --- | --- | --- |
| `accelint-qrspi-propose` | QRSPI/OpenSpec 变更规划 | 对非小型功能、跨模块改动、迁移、公开 API 或架构变更进行 Questions → Research → Design → Structure 规划 | OpenSpec 未初始化，或需求为已定位的小型修改 |
| `accelint-qrspi-apply` | QRSPI/OpenSpec 变更实施 | 已有经批准的 OpenSpec 变更及 `tasks.md`，需要按任务实施、验证和恢复进度 | 仅需规划，或尚未批准设计和任务 |
| `tdd` | 测试先行开发 | 关键功能、回归 Bug 或集成路径需要先写失败测试并完成 Red-Green-Refactor | 纯文档、视觉样式微调或无法建立可靠自动化测试的任务 |

## Frontend

| Skill | 主要职责 | Use When | Do Not Use When |
| --- | --- | --- | --- |
| `vue-best-practices` | Vue SFC 与 Composable 实现 | 新增或修改 `.vue`、Component、Composable、Props / Emits 或 Vue reactivity | 仅 Store、Router 配置、测试、文档或浏览器验收 |
| `pinia` | Pinia Store 实现 | 定义或修改 Store、State、Getter、Action、Store subscription 或跨页面全局状态 | 局部组件状态、普通 Vue Component、Router 或测试任务 |
| `vue-router-best-practices` | Vue Router 实现 | 修改 Route Record、Route Params、Navigation Guard、Lazy Loading 或路由生命周期逻辑 | 普通 Vue Component、Pinia Store、测试或仅链接样式调整 |
| `vue-testing-best-practices` | Vue 组件、Composable 与 Unit Test | 新增或修改 Vitest、Vue Test Utils、Component / Composable Test、Mock 或测试隔离 | 需要真实浏览器运行时证据的 E2E / UI 验收 |
| `webapp-testing` | 真实浏览器行为验证 | 需要用 Playwright 验证交互、路由、DOM、截图、控制台日志或运行时证据 | Unit / Component Test，或无需浏览器证据的实现任务 |

## Backend

| Skill | 主要职责 | Use When | Do Not Use When |
| --- | --- | --- | --- |
| `nestjs-best-practices` | NestJS 模块与服务实现 | 新增或修改 NestJS Module、Controller、Service、Guard、Pipe、Interceptor、DTO、Repository、配置或 NestJS 测试 | 纯前端、数据库性能专项、纯文档或仅 Git 审查 |

## Routing Rules

- 仅在 Requirement 与表中 Trigger 直接匹配时使用对应 Skill；简单、局部任务可以不使用任何 Skill。
- 一个任务默认只选择一个主要 Skill，并按表中边界确定。例如修改 Pinia Store 选 `pinia`，修改 Navigation Guard 选 `vue-router-best-practices`，不要同时套用多个同类 Skill。
- QRSPI 的规划与实施是前后阶段，不在同一阶段同时调用：先用 `accelint-qrspi-propose` 产出并批准变更，再用 `accelint-qrspi-apply` 实施。
- `accelint-qrspi-propose` 和 `accelint-qrspi-apply` 依赖已初始化的 OpenSpec 项目及其所需工作流；条件不满足时报告限制，不伪造规划或验证结果。
- Skill 不可用或缺少其所需 Capability 时，不伪造使用或验证结果；按 `AGENTS.md` 的 Validation 规则报告限制。

## Explicit-only Skills

以下已安装 Skill 不纳入自动 Routing。仅在用户明确要求、且 Requirement 与其 Trigger 完全匹配时使用：

- `vue`：仅在任务明确依赖 `defineModel`、`defineExpose`、watcher、Transition、Teleport、Suspense 或 KeepAlive 等 Vue API 语义时使用；普通 Vue 实现由 `vue-best-practices` 处理。
- `web-design-guidelines`：仅在明确要求 UI、UX 或无障碍审查时使用；不负责实现普通功能。
- `frontend-design`：其强视觉创意导向不应覆盖本项目以 Element Plus、Vant 和一致性为主的 UI 规范。
- `accelint-ac-to-playwright`：需要明确 Acceptance Criteria / Gherkin、测试 Hook 约定及指定产物目录，适合专门的测试自动化任务。
- `vite`：仅在 `vite.config.*`、Vite Plugin、SSR 或构建工具问题中按需使用。
- `vitest`：仅在 Vitest CLI、配置、Coverage、Reporter 或框架 API 问题中按需使用。
- `code-review`：仅在用户提供 Git 比较基线并明确要求 Review 时使用。
- `accelint-security-best-practices`：仅在明确安全审查，或修改认证、授权、JWT、Cookie、公开接口、文件上传、秘密信息或敏感数据时使用。
- `backend-architecture-refactor`：仅在明确要求重构 NestJS 模块边界、依赖方向、分层或服务结构时使用。
- `accelint-ts-performance`：仅在有明确性能目标或证据，例如慢接口、高 CPU、N+1、内存问题或复杂度问题时使用。
- `build-web-apps:supabase-postgres-best-practices`：仅在 PostgreSQL Schema、SQL、查询计划、索引或数据库性能优化时使用；普通 MikroORM Entity/Repository 修改不触发。
- `diagnosing-bugs`：仅在根因未知、跨模块异常、性能回归或无法稳定复现的问题中使用；已知修复方式的普通 Bug 不触发。
