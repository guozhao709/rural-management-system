<!-- Inherits from: ../AGENTS.md -->
<!-- Only Backend-specific additions are defined here. -->

# Backend Agent Policy

## Scope

Backend 负责 HTTP API、Authentication、Authorization、Business Rule、Persistence、服务端校验、External Service 以及 AI/Tool Integration。

Backend 不依赖 `nest_front/` Source Code，也不依赖客户端逻辑保证业务正确性或安全性。

## Sources

开始 Backend 任务前，按范围读取：

- `docs/module/index.md`
- 当前模块 Requirement、Design、Database Design、API 设计基线，以及已生成时的严格 API Contract
- `nest_server/docs/technologyStack/index.md`
- `docs/development/index.md`

NestJS、TypeScript、MikroORM 和 Testing 的通用实践使用 Approved Skill；本文件只定义项目特有边界。

## Architecture Boundaries

- Controller 处理 HTTP Boundary，不直接访问 EntityManager/Repository 或实现核心 Business Rule。
- Entity 不作为外部 Request DTO。
- 模块通过明确的 Public Interface/Export 协作，不访问其他模块内部实现。
- 不创建与现有 Infrastructure 平行的第二套 API Client、Persistence 或 Tool 实现。
- External Input、API Response、LLM Output 和 Tool Result 在进入业务逻辑或持久化前完成必要验证。
- Credential 不暴露给 Client 或 LLM。

## Persistence

- Schema、Entity、Relation、Constraint 变化必须检查现有数据影响和 Migration。
- 不通过运行时自动同步 Schema 替代 Migration。
- 不为重命名或整理改写已执行 Migration。
- Controller 不直接操作数据库，Persistence Logic 不散落在 HTTP Layer。
- 直接 SQL 需要明确 Requirement 或性能证据。
- Transaction 围绕完整业务操作；External API、LLM 或 Tool 调用不得无必要长期占用数据库事务。

## API & Security

- API 设计基线仅以 `docs/module/<domain>/api.md` 为准；严格 API Contract 仅以已生成的 `docs/module/<domain>/api-contract.md` 为准。
- 实施 HTTP Endpoint 前确认 API 设计基线；Backend 完成并验证后依据实际行为生成或更新严格 API Contract。未生成严格 Contract 时，不得把实现直接声明为 Frontend 的契约。
- 严格 Contract Change 必须检查 Frontend Consumer。
- Authentication 和 Authorization 变更必须验证成功路径与拒绝路径。
- 不将 Stack、Credential、数据库细节或内部异常直接返回 Client。
- 不根据现有 Backend 实现单方面定义新的 API Behavior。

## Legacy

`src/modules/agriculture/` 是冻结的 Nest 旧业务实现；`src/modules/resident-health/` 已移除。新健康业务不得重新引入旧 DTO、Entity、Table、Route 或业务模型。

## Validation

按变更风险选择验证：

- Controller/API：类型、Lint 和相关 Integration/E2E；
- Business Logic：类型、Lint 和相关测试；
- Schema/Persistence：Migration 与真实数据兼容性检查；
- Authentication/Authorization：允许和拒绝路径；
- Contract：Backend Provider 与 Frontend Consumer；
- External/AI/Tool：成功、异常和无效输出路径。

测试替身或 mocked E2E 不得表述为真实 PostgreSQL、Migration 或外部服务验收。
