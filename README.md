# 智乡云

“智乡云”是面向农业、居民健康与 AI 智能服务的多应用平台。当前开发目标由两个 Vue SPA 和一个 NestJS 服务组成；旧目录 `front-end/`、`servers/` 仅供参考，不得修改。

## 开发入口

环境要求为 Node.js 24 与 pnpm 11。依赖统一在仓库根目录安装：

```bash
pnpm install --frozen-lockfile
```

常用命令：

| 目的         | 命令              |
| ------------ | ----------------- |
| 启动全部应用 | `pnpm dev`        |
| 启动管理员端 | `pnpm dev:admin`  |
| 启动用户端   | `pnpm dev:users`  |
| 启动后端     | `pnpm dev:server` |
| 类型检查     | `pnpm typecheck`  |
| 静态检查     | `pnpm lint`       |
| 单元测试     | `pnpm test`       |
| 构建全部应用 | `pnpm build`      |

完整环境前提、应用映射和验证边界见 [开发与验证入口](./docs/development/index.md)。

## 项目导航

- [项目级 Agent 规范](./AGENTS.md)
- [Frontend Agent 规范](./nest_front/AGENTS.md)
- [Backend Agent 规范](./nest_server/AGENTS.md)
- [M01 用户、管理员与认证接口](./docs/接口文档/M01/index.md)
- [M08 农业接口](./docs/接口文档/M08/index.md)
- [M09 健康接口](./docs/接口文档/M09/index.md)
- [Approved Skills](./docs/skill-list/index.md)
- [Agent 环境事实](./docs/agent/environment-profile.md)
- [Agent 环境决策](./docs/agent/environment-decisions.md)

Frontend 与 Backend 是独立应用边界，只通过正式 API Contract 通信。具体任务开始前，应按 `AGENTS.md` 的 Source of Truth 路由读取对应文档。
