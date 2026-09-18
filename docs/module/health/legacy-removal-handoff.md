# Nest 旧健康业务移除工作总结

> 状态日期：2026-09-17  
> 文档性质：工作总结与后续对话交接，不是 Requirement、Domain Design、Database Design、API Contract 或执行授权。当前业务来源仍以本目录下的正式文档和 `docs/module/index.md` 的状态登记为准；目前独立 Domain Design 仍为 `NOT DEFINED`。

## 1. 本轮目标

本轮只执行健康业务调整的第一步：移除当前应用中的 Nest 旧健康业务运行时和旧 Frontend Consumer。

以下后续工作明确未在本轮执行：

1. 根据当前健康文档实现新 Backend 和 Database；
2. 根据当前 API Contract 重建 Frontend 健康业务。

## 2. 已完成内容

### 2.1 Backend

- 删除 `nest_server/src/modules/resident-health/` 下的旧 Module、Controller、Service、DTO、Entity、Adapter、Schema、Seed、Port、类型和单元测试。
- 从 `nest_server/src/app.module.ts` 移除 `ResidentHealthModule` 和旧健康配置注册。
- 从 MikroORM 实体发现列表中移除旧健康 Entity，但未修改历史 Migration。
- 删除旧健康专用环境变量、启动期校验和 `.env.example` 示例。
- 移除 `UsersModule`、`UsersService` 对旧 `HealthDataLifecycleService` 的依赖；用户删除流程恢复为只执行用户软删除。
- 删除 Backend HTTP E2E 中的旧健康 Provider Mock 和旧健康接口场景。

### 2.2 Frontend

- 删除 `nest_front/users/src/views/health/` 下的旧健康页面、组件、API Client、类型、工具和测试。
- 删除用户端 `/health` 路由及首页“进入健康服务”入口。
- 删除只验证旧 `/health` 页面存在的 Playwright 用例。

### 2.3 Agent 环境与项目说明

- 更新根、Frontend 和 Backend 的 `AGENTS.md`，将现状明确为“新健康业务尚未实现，Nest 旧健康运行时代码已移除”。
- 更新 `docs/module/index.md` 中的健康模块 Implementation 状态。
- 更新 Agent environment decision/profile 和 Backend README，移除已失效的旧健康运行时说明与环境变量。

任务开始时 `git status --short` 和 `git diff --name-only` 均为空。本轮完成代码与状态文档调整后，合计删除 58 个文件、修改 18 个文件；只读 Git diff 显示 2738 行删除、16 行新增。本文是随后新增的第 1 个交接文档，不计入上述实施统计。

## 3. 明确保留内容

以下内容经过确认后在本轮保留，不属于本轮删除范围；这不构成永久保留决定，也不阻止下一轮在取得授权后通过新 Migration 迁移或删除旧数据库对象：

- 当前健康业务文档：
  - `docs/module/health/requirements.md`
  - `docs/module/health/database.md`
  - `docs/module/health/api.md`
- `docs/module/legacy/nest/health/` 中的历史资料；它们只能用于历史核对，不得作为当前实现基线。
- `nest_server/src/infrastructure/database/migrations/` 中已经执行或可能已执行的旧健康 Migration。
- 数据库中由历史 Migration 建立的旧健康表和开发数据。
- `nest_server/src/health/` 及 `/health`、`/health/ready` 系统存活与就绪检查；它们不是健康业务模块。
- `front-end/`、`servers/` Express 旧项目，继续保持只读。
- 现有 Dependency Manifest 和根 Lockfile。

## 4. 验证结果

| 验证                    | 结果      | 证据与边界                                                                                                                                                                         |
| ----------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 旧健康运行时残留扫描    | `PASS`    | 当前 `nest_front/`、`nest_server/` 源码中未发现 `resident-health`、旧健康 Provider、旧 `/api/v2/health` Consumer 或 `HEALTH_*` 配置残留；历史 Migration 和 Legacy 文档按计划排除。 |
| Backend typecheck       | `PASS`    | `pnpm --filter zhixiang-cloud-v2-server typecheck`                                                                                                                                 |
| Backend lint            | `PASS`    | `pnpm --filter zhixiang-cloud-v2-server lint`                                                                                                                                      |
| Backend build           | `PASS`    | `pnpm --filter zhixiang-cloud-v2-server build`                                                                                                                                     |
| Backend unit test       | `PASS`    | 12 个 Test Suite、44 个 Test 全部通过。                                                                                                                                            |
| Backend HTTP E2E        | `PASS`    | 1 个 Test Suite、14 个 Test 全部通过；使用测试替身，不代表真实 PostgreSQL 验收。                                                                                                   |
| 用户端 typecheck        | `PASS`    | `pnpm --filter zhixiang-cloud-users typecheck`                                                                                                                                     |
| 用户端 lint             | `PASS`    | `pnpm --filter zhixiang-cloud-users lint`                                                                                                                                          |
| 用户端 build            | `PASS`    | `pnpm --filter zhixiang-cloud-users build`                                                                                                                                         |
| 用户端 unit test        | `PASS`    | 3 个 Test File、4 个 Test 全部通过。                                                                                                                                               |
| 用户端 Browser E2E      | `BLOCKED` | 唯一剩余场景的断言执行过程中通过，但 Playwright 进程在 Windows 上未自动退出，人工终止后整条命令退出码为 1；不得据此宣称 Browser E2E 或功能验证通过。                               |
| Repository format check | `FAIL`    | `nest_server` 的 Prettier 检查报告 34 个文件存在格式问题，包含多处本轮范围外的旧农业代码和不可变 Migration；本轮未扩大范围统一格式化。                                             |
| Diff whitespace check   | `PASS`    | `git diff --check` 通过。                                                                                                                                                          |

当前健康三份正式文档在清理前后 SHA-256 一致，确认未被本轮改写：

| 文件              | SHA-256                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `requirements.md` | `8050C77ED9302E809CA0C2E183213D2C4A3ADBB5E480F477F5F863080E0BAA3A` |
| `database.md`     | `23868AA4D3BDE8BF58850FC443C518872F413F64D1851A0D319D5434D07AAD5C` |
| `api.md`          | `33987544E6343D7A4EA542F8B9BEB36CFD24E50ED0434649B81C0F6B2C97DEC8` |

## 5. 当前状态与已知边界

- 当前健康业务状态为 `NOT IMPLEMENTED`。
- Nest 旧健康 HTTP Endpoint 和用户端页面已经不可用；本轮没有建立兼容层。后续兼容政策仍须以当前 Contract 和明确授权为准。
- 旧健康 Entity 已退出 MikroORM 当前实体发现。本轮未连接数据库盘点真实 Schema、Migration 执行状态或数据，因此只能确认历史 Migration 文件仍存在，不能确认具体旧数据库对象是否存在。
- 用户删除时不再调用旧健康数据清理服务。新健康实现必须按下一轮重新确认并批准的 Database Design 定义删除、匿名化、保留期和审计行为，不能恢复旧服务。
- 当前健康 Requirement、Database Design 和 API Contract 本轮未修改；它们的当前性和批准状态必须以 `docs/module/index.md` 与下一轮明确授权重新核对。`docs/module/index.md` 仍将 Domain Design 标记为 `NOT DEFINED`。

## 6. Gate 与授权状态

| 项目                  | 当前状态                 | 下一轮要求                                                                                                                                        |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement           | 已有当前文档，本轮未修改 | 开工前重新读取并确认适用版本。                                                                                                                    |
| Domain Design         | `NOT DEFINED`            | Backend 业务逻辑实施前必须由用户或其他有权决策者明确确认现有正式文档足以满足 Design Gate；实施 Agent 不得自行批准。否则先建立并批准 `design.md`。 |
| Database Design       | 已有当前文档，本轮未修改 | Schema/Migration 实施前重新确认批准状态、旧 Schema 影响和迁移策略。                                                                               |
| API Contract          | 已有当前文档，本轮未修改 | Endpoint 或 Frontend 集成前重新确认；Contract 变化必须同步检查 Provider 与 Consumer。                                                             |
| 破坏性 Schema Change  | `NOT AUTHORIZED`         | 下一轮必须取得明确授权；“开发数据允许丢弃”只是可选政策条件，不是执行授权。                                                                        |
| 旧 Migration 改写     | 禁止                     | 通过新的 Migration 表达替换或清理，不得修改已执行 Migration。                                                                                     |
| 数据库基线            | `NOT INSPECTED`          | 先核实现存 Schema、Migration 执行状态和数据基线，再决定 reset、drop 或迁移方案。                                                                  |
| 新 Backend / Database | `NOT IMPLEMENTED`        | 第二步单独实施并验证。                                                                                                                            |
| 新 Frontend           | `NOT IMPLEMENTED`        | 第三步按当前 Contract 单独实施并验证。                                                                                                            |

## 7. 下一轮建议入口

下一轮对话开始时建议按以下顺序重新读取事实，不直接依赖本总结推断实现：

1. 根 `AGENTS.md`、`nest_server/AGENTS.md` 和 `nest_front/AGENTS.md`；
2. `docs/module/index.md`；
3. `docs/module/health/requirements.md`；
4. `docs/module/health/database.md`；
5. `docs/module/health/api.md`；
6. `docs/development/index.md` 和适用的 Approved Skills。

建议第二步单独处理 Backend 与 Database：先完成 Design Gate 和迁移策略，再建立新健康 Domain、Schema、Migration、Service、Endpoint 和验证。用户已说明开发数据库数据可以丢弃，但下一轮仍须将具体破坏性操作、目标对象和 Migration/reset 策略作为新的明确授权事项，不能仅凭本总结执行。

建议第三步单独重建 Frontend：只依赖当前 API Contract，不恢复旧健康页面、旧 DTO、旧 Route 设计或旧交互模型；同时为新的公开路由、授权边界和核心流程建立对应测试。

## 8. 可复现检查入口

以下命令均从仓库根目录执行。它们记录本轮主要验证入口，不替代下一轮重新验证：

```powershell
pnpm --filter zhixiang-cloud-v2-server typecheck
pnpm --filter zhixiang-cloud-v2-server lint
pnpm --filter zhixiang-cloud-v2-server test
pnpm --filter zhixiang-cloud-v2-server test:e2e
pnpm --filter zhixiang-cloud-v2-server build
pnpm --filter zhixiang-cloud-v2-server format:check
pnpm --filter zhixiang-cloud-users typecheck
pnpm --filter zhixiang-cloud-users lint
pnpm --filter zhixiang-cloud-users test
pnpm --filter zhixiang-cloud-users build
pnpm --filter zhixiang-cloud-users test:e2e
git diff --check
```

本轮残留扫描覆盖 `nest_front/` 与 `nest_server/`，排除保留的 Migration、Legacy/状态说明和生成目录，检索了 `resident-health`、`ResidentHealth`、`HealthDataLifecycle`、旧 `HEALTH_*` 配置、`user-health`、`views/health` 与 `/api/v2/health` 等旧运行时标识。下一轮应根据新增实现重新定义扫描范围，不能机械沿用“零命中”要求。

## 9. 下一轮禁止误用

- 不从 Git 历史、Legacy 文档或已删除代码复制旧健康模型作为新实现。
- 不修改已经执行的旧 Migration 来适配新 Schema。
- 不因为开发数据可丢弃，就跳过 Migration、约束、审计、隐私和数据生命周期设计。
- 不将本工作总结中的建议视为已批准的 Domain Design 或迁移授权。
