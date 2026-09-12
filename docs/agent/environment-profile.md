# Repository Agent Environment Profile

> 本文记录可从仓库重新发现的环境事实；项目政策见 `environment-decisions.md`。

Last reviewed: 2026-09-12

## Repository

- Shape: 根 pnpm workspace，包含三个当前应用与两个只读旧项目目录。
- Primary languages: TypeScript、Vue SFC。
- Primary frameworks: Vue 3、Vite、NestJS 11、MikroORM 7。
- Production apps: `nest_front/admin`、`nest_front/users`、`nest_server`。
- Reference-only apps: `front-end/`、`servers/`。
- Shared packages: 当前没有独立 shared package；两个 SPA 不直接共享业务源码。

## Runtime and Package Management

- Runtime: Node.js 24。
- Runtime version source: 根 `package.json#engines`。
- Package manager: pnpm 11。
- Package manager version source: 根 `package.json#packageManager` 与 `engines`。
- Workspace/build system: 原生 pnpm workspace，不使用 Nx 或 Turborepo。
- Lockfile strategy: 根 `pnpm-lock.yaml` 是三个当前应用的唯一锁文件。

## Commands

| Purpose      | Command                                               | Working directory | Notes                             |
| ------------ | ----------------------------------------------------- | ----------------- | --------------------------------- |
| Install      | `pnpm install --frozen-lockfile`                      | repository root   | 不在子应用创建锁文件              |
| Dev          | `pnpm dev`                                            | repository root   | 并行启动三个应用                  |
| Typecheck    | `pnpm typecheck`                                      | repository root   | 前端会写入增量缓存                |
| Lint         | `pnpm lint`                                           | repository root   | 不自动修复                        |
| Format check | `pnpm --filter zhixiang-cloud-v2-server format:check` | repository root   | 当前仅后端配置 Prettier           |
| Test         | `pnpm test`                                           | repository root   | 单元/组件测试，不证明真实外部集成 |
| Browser E2E  | `pnpm test:e2e:front`                                 | repository root   | 需要 Playwright Chromium          |
| Build        | `pnpm build`                                          | repository root   | 写入各应用 `dist/`                |

## Agent Instructions and Documentation

- Root instructions: `AGENTS.md`。
- Nested instructions: `nest_front/AGENTS.md`、`nest_server/AGENTS.md`。
- Approved skills: `docs/skill-list/index.md`；Skill 实现在各开发者或 Agent Host 本机安装。
- Cross-boundary API Contract: `docs/接口文档/`。
- Development and validation entry: `docs/development/index.md`。
- Frontend-specific standards: `nest_front/docs/`。
- Backend-specific standards and designs: `nest_server/docs/`。

## Environment Configuration

- Backend example: `nest_server/.env.example`。
- Frontend examples: `nest_front/admin/.env.example`、`nest_front/users/.env.example`。
- Backend runtime validation: `nest_server/src/config/environment.validation.ts`。
- Frontend runtime readers: each SPA's `src/app/config.ts`。
- External dependencies: PostgreSQL；部分农业和健康能力还依赖显式启用的 LLM 配置。

## Verification Infrastructure

- Type/compile: TypeScript、Vue TSC、NestJS build。
- Lint/static analysis: ESLint 10。
- Formatting: 后端 Prettier；前端没有统一格式门禁。
- Unit/component tests: Jest、Vitest、Vue Test Utils。
- HTTP E2E: Supertest，当前使用替代 Provider，不等于真实数据库验收。
- Browser E2E: Playwright Chromium，管理员桌面视口与用户移动端模拟。
- Real persistence checks: Docker Compose PostgreSQL、MikroORM migration 与 `/health/ready`，需独立运行。
- CI: 仓库内未配置。
- Git hooks: 仓库内未配置。

## Known Drift / Unknowns

- `pnpm-workspace.yaml` 声明了 `minimumReleaseAgeExclude`，但没有仓库级 `minimumReleaseAge`，排除项当前没有生效对象。
- 是否以及何时引入 CI、统一根验证脚本或前端格式门禁尚未决定。
- 受项目 Git Policy 限制，Agent 不通过 Git 命令检查跟踪状态或工作区状态。
