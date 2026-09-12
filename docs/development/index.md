# 开发与验证入口

本文定义新项目的运行入口和环境前提。具体业务需求、接口和验收标准由对应任务提供；本文不记录业务开发进度。

## 环境与依赖

- 使用 Node.js 24、pnpm 11，具体约束以根 `package.json` 的 `engines` 和 `packageManager` 为准。
- 在仓库根目录执行 `pnpm install --frozen-lockfile`。依赖变更获准后，使用 `pnpm install` 更新根 `pnpm-lock.yaml`。
- 新前后端共用根 workspace 和锁文件；不在子应用重新建立独立 workspace 或锁文件。
- `verifyDepsBeforeRun: error` 在依赖过期时阻止运行并要求显式安装，避免验证命令隐式安装或并发改写依赖目录；该行为见 [pnpm 配置说明](https://pnpm.io/settings/build#verifydepsbeforerun)。
- `pnpm-workspace.yaml` 的 `allowBuilds` 明确控制依赖安装脚本。仅对已确认需要的包开放，不全局允许所有依赖脚本。
- 旧目录 `front-end/`、`servers/` 不属于当前 workspace，按根 AGENTS 保持只读。

## 应用映射

以下命令均在仓库根目录执行。

| 应用 | 工作目录 | 包名 | 启动 | 构建 |
| --- | --- | --- | --- | --- |
| 管理员端 | `nest_front/admin` | `zhixiang-cloud-admin` | `pnpm dev:admin` | `pnpm build:admin` |
| 用户端 | `nest_front/users` | `zhixiang-cloud-users` | `pnpm dev:users` | `pnpm build:users` |
| 后端 | `nest_server` | `zhixiang-cloud-v2-server` | `pnpm dev:server` | `pnpm build:server` |

- `pnpm dev` 同时启动三个新应用；前端开发端口分别为 5173、5174，占用时直接报错。
- `pnpm build` 构建三个新应用；构建会写入各应用的 `dist/`，后端构建脚本会清理自身 `dist/`。
- 后端启动需要配置验证通过的本地环境及 PostgreSQL。不要输出真实环境值。数据库迁移、Seed 和真实外部服务调用不由以上验证命令自动执行。
- 只处理某个应用时，使用对应命令，避免启动无关服务。

## 环境配置入口

- 后端从 `nest_server/.env` 读取本地配置，以 `nest_server/.env.example` 为键名和安全占位符样例；运行时约束以 `nest_server/src/config/environment.validation.ts` 为准。
- 管理员端和用户端分别以各自目录下的 `.env.example` 为样例，目前只使用非敏感的 `VITE_API_BASE_URL`。
- 前端构建变量会进入浏览器产物，不得放入 Credential、Private Key、长期 Token 或其他 Secret。
- `.env` 与本地环境覆盖文件不得纳入版本控制；`.env.example` 只保留可公开、安全且不可直接用于生产的值。

## 验证入口

| 根命令 | 覆盖范围 | 环境与结果边界 |
| --- | --- | --- |
| `pnpm typecheck` | 三个新应用的类型检查 | 可能写入 TypeScript 增量缓存，不证明运行时行为 |
| `pnpm lint` | 三个新应用的静态规范检查 | 不自动修复文件 |
| `pnpm test` | 前端 Vitest、后端 Jest 单元测试 | 不代表真实数据库或外部服务验收 |
| `pnpm test:front` | 两个前端组件与单元测试 | 使用 jsdom，无需启动后端 |
| `pnpm test:e2e:front` | 两个前端的 Playwright 场景 | 需要 Chromium，自动启动独立本地前端服务 |
| `pnpm --filter zhixiang-cloud-v2-server test:e2e` | 后端 HTTP 集成场景 | 是否连接真实依赖以测试配置为准，不能仅凭 E2E 名称宣称数据库验收 |

运行 Related Test 时可进入应用目录执行其脚本。前端配置、安装浏览器及条件性验证见 [前端验证规范](../../nest_front/docs/validation/index.md)。后端业务变更按 [Backend AGENTS](../../nest_server/AGENTS.md) 选择必要测试。

报告必须区分 `PASS`、`FAIL`、`NOT RUN`、`BLOCKED`，包含实际覆盖范围。没有业务场景时不得以空测试、`passWithNoTests` 或关闭规则使门禁通过。
