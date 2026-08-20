# 智乡云 V2 后端

基于 NestJS 11、TypeScript 6、PostgreSQL 18 和 MikroORM 7 的后端技术基座。

当前项目已完成基础运行环境、Admin/User 数据模型与后台 CRUD，以及正式的 JWT 认证、Refresh Token Rotation 和管理员角色鉴权。文章、农业、健康、客服和 AI Agent 尚未实现。

## 目录

- [环境要求](#环境要求)
- [安装](#安装)
- [本地启动](#本地启动)
- [环境变量](#环境变量)
- [可用端点](#可用端点)
- [常用命令](#常用命令)
- [数据库迁移](#数据库迁移)
- [项目结构](#项目结构)
- [技术选择](#技术选择)
- [测试与质量检查](#测试与质量检查)
- [现阶段边界](#现阶段边界)
- [相关文档](#相关文档)

## 环境要求

| 工具       | 版本                                                 |
| ---------- | ---------------------------------------------------- |
| Node.js    | 24.x LTS                                             |
| pnpm       | 11.x                                                 |
| Docker     | 支持 Docker Compose v2 的当前稳定版本                |
| PostgreSQL | 本地通过 Docker Compose 启动 18.4，宿主机端口为 5433 |

项目通过以下文件固定运行时版本：

- `.nvmrc`
- `.node-version`
- `package.json` 中的 `engines` 与 `packageManager`

## 安装

进入本目录并安装依赖：

```bash
cd nest_server
pnpm install
```

项目只使用 pnpm。依赖版本已精确固定，`pnpm-lock.yaml` 应提交到版本库。

## 本地启动

### 1. 准备环境变量

macOS 或 Linux：

```bash
cp .env.example .env
```

PowerShell：

```powershell
Copy-Item .env.example .env
```

`.env` 已被 Git 忽略。提交代码前不要把真实密码、JWT 密钥或 LLM API Key 写入其他文件。

### 2. 启动 PostgreSQL

```bash
docker compose up -d
```

等待数据库健康检查通过：

```bash
docker compose ps
```

Compose 使用官方 `postgres:18.4-alpine` 镜像，数据保存到 `postgres_data` 命名卷。容器内 PostgreSQL 仍监听 5432；宿主机使用 5433，避免与常见的本机 PostgreSQL 端口冲突。

### 3. 执行迁移

```bash
pnpm migration:up
```

该命令会应用包含 `admins` 与 `users` 表的业务 Migration。

### 4. 启动开发服务器

```bash
pnpm dev
```

默认地址：`http://localhost:3000`。

## 环境变量

| 变量                 | 必填 | 默认值        | 用途                                                          |
| -------------------- | ---- | ------------- | ------------------------------------------------------------- |
| `NODE_ENV`           | 否   | `development` | `development`、`test` 或 `production`                         |
| `PORT`               | 否   | `3000`        | HTTP 监听端口                                                 |
| `DATABASE_URL`       | 是   | 无            | PostgreSQL 连接 URL，只维护这一套数据库连接配置               |
| `JWT_ACCESS_SECRET`  | 是   | 无            | Access JWT Secret，至少 32 个字符                             |
| `JWT_REFRESH_SECRET` | 是   | 无            | Refresh JWT Secret，至少 32 个字符且必须与 Access Secret 不同 |
| `JWT_ACCESS_TTL`     | 否   | `15m`         | Access Token 生命周期                                         |
| `JWT_REFRESH_TTL`    | 否   | `30d`         | Refresh Token 生命周期                                        |
| `LLM_API_KEY`        | 否   | 空            | 为后续 LLM Provider 预留                                      |
| `LLM_BASE_URL`       | 否   | 空            | 为后续 OpenAI 兼容 Provider 预留                              |
| `LLM_MODEL`          | 否   | 空            | 为后续模型选择预留                                            |
| `CORS_ORIGINS`       | 是   | 无            | 逗号分隔的允许来源，不接受 `*`                                |
| `LOG_LEVEL`          | 否   | `info`        | Pino 日志级别                                                 |

应用启动时使用 Joi 校验环境变量。缺少数据库 URL、任一 JWT Secret、两个 Secret 相同或 CORS Origin 非法时，应用会直接启动失败。LLM 配置为空不会阻止服务启动。

## 可用端点

### 存活检查

```http
GET /health
```

该端点只检查 NestJS HTTP 服务是否存活，不发起数据库查询。

```json
{
  "code": 200,
  "message": "服务正常",
  "data": {
    "status": "ok"
  }
}
```

### 就绪检查

```http
GET /health/ready
```

该端点执行 `SELECT 1`，同时检查 NestJS 与 PostgreSQL。

```json
{
  "code": 200,
  "message": "服务已就绪",
  "data": {
    "status": "ok",
    "database": "up"
  }
}
```

### Swagger

开发和测试环境访问：

```text
http://localhost:3000/api/docs
```

生产环境不会挂载 Swagger UI。

### 管理员与用户 CRUD

| Method   | URL                        | 用途                     |
| -------- | -------------------------- | ------------------------ |
| `POST`   | `/api/v2/admin/admins`     | 创建管理员（非注册）     |
| `GET`    | `/api/v2/admin/admins`     | 分页查询管理员           |
| `GET`    | `/api/v2/admin/admins/:id` | 查询管理员详情           |
| `PATCH`  | `/api/v2/admin/admins/:id` | 部分更新管理员           |
| `DELETE` | `/api/v2/admin/admins/:id` | 软删除管理员             |
| `POST`   | `/api/v2/admin/users`      | 管理员创建用户（非注册） |
| `GET`    | `/api/v2/admin/users`      | 分页查询用户             |
| `GET`    | `/api/v2/admin/users/:id`  | 查询用户详情             |
| `PATCH`  | `/api/v2/admin/users/:id`  | 部分更新用户             |
| `DELETE` | `/api/v2/admin/users/:id`  | 软删除用户               |

两个模块均使用 Argon2id 保存密码 Hash、显式 Presenter 输出、数据库唯一约束与软删除。所有默认查询都会排除 `deleted_at IS NOT NULL` 的记录。

Admin CRUD 要求管理员 Access Token 且当前数据库角色为 `super_admin`。User 管理 CRUD 允许 `admin` 与 `super_admin`。

### 认证端点

| Method | URL                          | 认证                 | 用途                     |
| ------ | ---------------------------- | -------------------- | ------------------------ |
| `POST` | `/api/v2/auth/user/register` | 匿名                 | 用户注册并登录           |
| `POST` | `/api/v2/auth/user/login`    | 匿名                 | 用户登录                 |
| `POST` | `/api/v2/auth/user/refresh`  | User Refresh Cookie  | 用户 Token Rotation      |
| `POST` | `/api/v2/auth/user/logout`   | User Refresh Cookie  | 撤销用户 Refresh Token   |
| `GET`  | `/api/v2/auth/user/me`       | User Access Token    | 当前用户                 |
| `POST` | `/api/v2/auth/admin/login`   | 匿名                 | 管理员登录               |
| `POST` | `/api/v2/auth/admin/refresh` | Admin Refresh Cookie | 管理员 Token Rotation    |
| `POST` | `/api/v2/auth/admin/logout`  | Admin Refresh Cookie | 撤销管理员 Refresh Token |
| `GET`  | `/api/v2/auth/admin/me`      | Admin Access Token   | 当前管理员与实时角色     |

Access Token 通过 JSON 返回并使用 Bearer Header；Refresh Token 只存放在按 User/Admin 隔离的 HttpOnly Cookie 中。数据库只保存 SHA-256 Hash，每个账号同一时刻只有一个有效 Refresh Token。

## 常用命令

| 命令                    | 说明                                   |
| ----------------------- | -------------------------------------- |
| `pnpm dev`              | 使用 Nest CLI + webpack watch 启动     |
| `pnpm build`            | 清理并编译到 `dist`                    |
| `pnpm start`            | 使用 Nest CLI 启动                     |
| `pnpm start:prod`       | 运行已编译的 `dist/main.js`            |
| `pnpm typecheck`        | 仅执行 TypeScript 类型检查             |
| `pnpm lint`             | 检查 TypeScript 代码                   |
| `pnpm lint:fix`         | 修复可自动处理的 ESLint 问题           |
| `pnpm format`           | 使用 Prettier 格式化工程文件           |
| `pnpm format:check`     | 检查格式，不修改文件                   |
| `pnpm test`             | 运行 Jest 单元测试                     |
| `pnpm test:e2e`         | 运行 Supertest 端到端测试              |
| `pnpm test:cov`         | 生成测试覆盖率报告                     |
| `pnpm orm:debug`        | 检查 MikroORM CLI 配置和数据库连接     |
| `pnpm migration:create` | 根据实体元数据和数据库差异创建迁移     |
| `pnpm migration:up`     | 应用待执行迁移                         |
| `pnpm migration:down`   | 回滚一个迁移                           |
| `pnpm migration:list`   | 查看已执行迁移                         |
| `pnpm seed:super-admin` | 通过环境变量一次性创建首位 super_admin |

首次启用鉴权且数据库尚无 `super_admin` 时，在本地环境中临时设置 `BOOTSTRAP_ADMIN_USERNAME`、`BOOTSTRAP_ADMIN_PASSWORD` 与 `DATABASE_URL` 后运行：

```bash
pnpm seed:super-admin
```

Seed 不提供 HTTP 管理员注册、不保存明文密码；如果数据库已经存在未删除的 `super_admin`，命令不会重复创建。执行后应立即清除终端环境中的 Bootstrap 密码。

## 数据库迁移

数据库 Schema 只通过 MikroORM Migration 演进。应用启动过程不会调用 `schema:update`，也不会执行 `CREATE TABLE IF NOT EXISTS` 创建业务表。

添加业务 Entity 后创建迁移：

```bash
pnpm migration:create -- --name add_example
```

检查生成的 SQL，再执行：

```bash
pnpm migration:up
```

回滚最近一个迁移：

```bash
pnpm migration:down
```

MikroORM CLI 使用 `src/mikro-orm.config.ts`，通过 `tsx` 加载 TypeScript 配置。开发迁移写入 `src/infrastructure/database/migrations`，构建产物从对应的 `dist` 目录读取。

## 项目结构

```text
nest_server/
├── docs/                              # V1 后端分析资料
├── src/
│   ├── common/
│   │   ├── constants/                 # HTTP 元数据键和默认值
│   │   ├── decorators/                # 响应包装跳过、响应消息元数据
│   │   ├── filters/                   # 全局异常响应
│   │   ├── interceptors/              # 普通 JSON 成功响应包装
│   │   ├── logger/                    # Pino 结构化日志
│   │   └── types/                     # 公共响应类型
│   ├── config/                        # 配置加载和启动校验
│   ├── health/                        # 系统存活与就绪检查
│   ├── infrastructure/
│   │   ├── ai/                        # AI 基础设施边界，当前无实现
│   │   └── database/                  # MikroORM、连接检查、迁移
│   ├── modules/
│   │   ├── admins/                    # 管理员 Entity、CRUD、DTO 与 Presenter
│   │   ├── auth/                      # JWT、Rotation、Guard、角色鉴权与 Cookie
│   │   └── users/                     # 普通用户 Entity、CRUD、DTO 与 Presenter
│   ├── app.module.ts
│   ├── app.setup.ts
│   ├── main.ts
│   └── mikro-orm.config.ts
├── scripts/                           # 构建辅助脚本
├── test/                              # Supertest 端到端测试
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── webpack.config.cjs                 # NodeNext 开发监听解析配置
└── tsconfig*.json
```

## 技术选择

### 模块系统

工程保留 NestJS 常见的 CommonJS 输出，不设置 `package.json#type=module`。TypeScript 使用 `module: NodeNext` 和 `moduleResolution: NodeNext`；在没有 `type: module` 的项目中，业务源码仍编译为 CommonJS，并由 Node.js 24 通过 `require(esm)` 加载原生 ESM 的 MikroORM 7。

这套配置满足 MikroORM 7 的 package exports 解析要求，同时保留 Nest CLI、Jest 与装饰器的常见开发方式。项目没有为了纯 ESM 改写所有导入路径。

### HTTP DTO 与 AI Schema

```text
HTTP Request -> class-validator + class-transformer
AI / LLM / Tool -> Zod
```

Admin/User HTTP DTO 使用 class-validator；AI Tool 或结构化模型输出仍保留给 Zod。

### 日志

`nestjs-pino` 记录结构化 HTTP 日志，包括时间、级别、请求 ID、方法、路径、状态码和响应时间。响应头会返回 `X-Request-Id`。

日志配置会遮盖 Authorization、Cookie、密码、Token、API Key 和健康信息字段。普通代码仍应避免主动记录完整请求体。

### 统一响应

普通 Controller JSON 响应由全局 Interceptor 包装为：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

SSE、文件和流式响应可以使用 `@SkipResponseEnvelope()` 跳过包装。Swagger UI 不经过 Controller Interceptor。

异常由全局 Filter 使用真实 HTTP 状态码返回，不会把业务失败伪装成 HTTP 200。

## 测试与质量检查

提交前运行：

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
```

端到端测试在 `NODE_ENV=test` 下关闭真实数据库连接，验证 HTTP 装配、Cookie、Guard、角色隔离和统一错误响应。事务锁、PostgreSQL 与 Migration 连接通过 Docker 环境单独验证：

```bash
pnpm orm:debug
pnpm migration:up
curl http://localhost:3000/health/ready
```

## 现阶段边界

当前已实现 Admin/User CRUD、Argon2id 密码、HS256 Access/Refresh JWT、Refresh Rotation、单账号单 Refresh Token、实时账户状态检查、User/Admin 身份隔离和管理员角色鉴权。

当前明确没有：

- 旧 Express 业务迁移
- Passport、Session、Redis、Token Blacklist、OAuth/OIDC、多设备 Refresh Token
- 农业、健康业务或知识库模块
- 客服、WebSocket、Redis、BullMQ、pgvector
- LangChain Agent、Tool、Chain 或真实模型请求
- 微服务、CQRS 或复杂 DDD 分层

当前 Access Token 不做 Blacklist，Logout 后已签发的 Access Token 最多继续有效至 15 分钟 TTL 结束。多设备长期登录需要未来引入独立 Session/设备模型后再设计。

## 相关文档

- [业务模块分析](./docs/业务模块.md)：旧 Express 后端的业务边界和待确认事项。
- [接口清单](./docs/接口.md)：旧 Express 后端现有 38 个接口的行为基线。

## 许可

此项目当前为私有项目，未授权对外分发。
