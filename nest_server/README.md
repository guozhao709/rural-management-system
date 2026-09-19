# 智乡云 V2 后端

基于 NestJS 11、TypeScript 6、PostgreSQL 18 和 MikroORM 7 的后端应用。认证与用户管理是当前能力；源码中的农业模块属于待替换的 Nest 旧业务实现，Nest 旧健康运行时代码已移除，新健康业务尚未实现。

业务目标和接口细节以 Root `docs/module/index.md` 路由的当前 Requirement、API 设计基线和已生成的严格 API Contract 为准；本 README 只提供开发环境入口。

## 环境要求与安装

- Node.js 24、pnpm 11；精确约束以根 `package.json` 为准。
- 三个当前应用共用根 pnpm workspace 和根 `pnpm-lock.yaml`。
- Docker Compose 用于本地 PostgreSQL 18.4，宿主机端口为 5433。

在仓库根目录安装依赖：

```bash
pnpm install --frozen-lockfile
```

不要在 `nest_server/` 创建独立 workspace 或锁文件。完整应用映射见 [开发与验证入口](../docs/development/index.md)。

## 本地启动

1. 将 `nest_server/.env.example` 复制为 `nest_server/.env`，并填写仅供本机使用的 Secret。
2. 启动 PostgreSQL：

   ```bash
   docker compose -f nest_server/docker-compose.yml up -d
   ```

3. 应用迁移：

   ```bash
   pnpm --filter zhixiang-cloud-v2-server migration:up
   ```

4. 启动后端：

   ```bash
   pnpm dev:server
   ```

默认服务地址为 `http://localhost:3000`。`GET /health` 只检查 HTTP 存活；`GET /health/ready` 会同时检查 PostgreSQL。开发与测试环境提供 `/api/docs` Swagger 页面。

## 环境变量

运行时约束由 `src/config/environment.validation.ts` 定义，`.env.example` 应与其保持同步。

| 分类      | 变量                                                                                              | 说明                               |
| --------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 基础      | `NODE_ENV`、`PORT`、`LOG_LEVEL`                                                                   | 运行模式、监听端口和日志级别       |
| 数据库    | `DATABASE_URL`                                                                                    | 必填 PostgreSQL URL                |
| 认证      | `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`                                                         | 均至少 32 字符且必须不同           |
| 认证      | `JWT_ACCESS_TTL`、`JWT_REFRESH_TTL`                                                               | Access 与 Refresh Token 生命周期   |
| Bootstrap | `BOOTSTRAP_ADMIN_USERNAME`、`BOOTSTRAP_ADMIN_PASSWORD`                                            | 仅 Seed 首位超级管理员时临时提供   |
| LLM       | `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`                                                        | OpenAI-compatible Provider；可为空 |
| LLM       | `LLM_TIMEOUT_MS`、`LLM_MAX_RETRIES`                                                               | 请求超时与有限重试                 |
| 农业      | `AGRICULTURE_ANALYSIS_ENABLED`、`AGRICULTURE_ANALYSIS_DAILY_LIMIT`、`AGRICULTURE_KNOWLEDGE_LIMIT` | 农业分析开关、日限额和检索数量     |
| HTTP      | `CORS_ORIGINS`                                                                                    | 必填，逗号分隔，不允许通配符       |

不得把真实 Credential 写入 `.env.example`、README 或其他仓库文件。

## 常用命令

以下命令默认在仓库根目录执行：

| 目的           | 命令                                                  |
| -------------- | ----------------------------------------------------- |
| 开发启动       | `pnpm dev:server`                                     |
| 构建           | `pnpm build:server`                                   |
| 类型检查       | `pnpm --filter zhixiang-cloud-v2-server typecheck`    |
| Lint           | `pnpm --filter zhixiang-cloud-v2-server lint`         |
| 格式检查       | `pnpm --filter zhixiang-cloud-v2-server format:check` |
| 单元测试       | `pnpm --filter zhixiang-cloud-v2-server test`         |
| HTTP E2E       | `pnpm --filter zhixiang-cloud-v2-server test:e2e`     |
| 数据库配置检查 | `pnpm --filter zhixiang-cloud-v2-server orm:debug`    |
| 数据库迁移     | `pnpm --filter zhixiang-cloud-v2-server migration:up` |

HTTP E2E 会替换 Persistence 和业务 Provider，不等于真实 PostgreSQL、Migration、外部 LLM 或生产配置验收。真实数据库验证需独立启动 Compose、执行迁移并检查 `/health/ready`。

## 结构

```text
nest_server/
├── docs/                       # Backend 技术栈与模块设计
├── scripts/                    # Seed、构建和真实外部服务验证脚本
├── src/
│   ├── common/                 # 通用响应、异常、日志与校验能力
│   ├── config/                 # 配置读取与启动期校验
│   ├── health/                 # 服务存活与数据库就绪检查
│   ├── infrastructure/         # 数据库与 AI 基础设施
│   └── modules/
│       ├── admins/
│       ├── auth/
│       ├── users/
│       └── agriculture/
├── test/                       # Supertest HTTP E2E
├── docker-compose.yml
└── package.json
```

## 正式文档

- [Backend Agent 规范](./AGENTS.md)
- [Backend 技术栈](./docs/technologyStack/index.md)
- [业务模块注册表](../docs/module/index.md)
- [认证 API 设计基线](../docs/module/auth/api.md)
- [农业业务需求](../docs/module/agriculture/requirements.md)
- [健康业务需求](../docs/module/health/requirements.md)
- [健康数据库设计](../docs/module/health/database.md)
- [健康 API 设计基线](../docs/module/health/api.md)
- [健康严格 API Contract](../docs/module/health/api-contract.md)
- [AI 聊天业务需求](../docs/module/ai/requirements.md)

旧 Nest 农业、健康 Contract、设计和实施记录仍保留在 `docs/module/legacy/nest/`，默认不得作为当前实现依据。

## 许可

此项目当前为私有项目，未授权对外分发。
