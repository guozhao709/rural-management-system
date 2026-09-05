# Backend Agent 规范

本目录为“智乡云”Backend Application。

本文件定义 Backend Scope 下的 Agent Policy。执行 Backend Task 时，应同时遵循：

`根 AGENTS.md + backend/AGENTS.md + 相关 docs + Approved Skill`

根目录规则已经定义的公共约束，本文件不重复。

## 1. Backend Scope

Backend 负责：

- HTTP API；
- Authentication；
- Authorization；
- Business Rule；
- Persistence；
- Server-side Validation；
- External Service Integration；
- AI / Tool Integration；
- Backend Error Handling。

Frontend 不属于本 Scope。

Backend 不得依赖 `frontend/` Source Code，也不得依赖 Client-side Logic 保证业务正确性或安全性。

## 2. Source of Truth

Backend Task 开始前，根据 Scope 读取相关文档。

### Source Map

`/nest_server/docs/technologyStack/index.md` 是 Backend Technology Stack 的正式来源。

若文档不存在，不得自行假设其内容。

具体 NestJS、TypeScript、Testing 等通用工程实践优先使用 Approved Skill。

## 3. NestJS Architecture Boundaries

遵循 Existing Backend Architecture 和 Module Responsibility。

默认职责边界：

```text
Controller
    ↓
Service / Use Case
    ↓
Persistence / Tool / External Integration
```

### Controller

Controller 主要负责：

- Route；
- Request Boundary；
- DTO / Parameter 接收；
- Authentication / Authorization Metadata；
- Service 调用；
- HTTP Layer Mapping。

不得在 Controller 中直接实现核心 Business Rule 或 Persistence Logic。

### Service

Service 负责：

- Business Rule；
- Use Case Orchestration；
- Domain Validation；
- Transaction Coordination；
- Persistence / Tool / External Service 调度。

避免无职责区分的 Giant Service。

### Module

Module 应围绕明确 Feature / Responsibility 组织。

新增 Module 前先确认：

- 是否已有同职责 Module；
- 是否真正存在独立 Boundary；
- 是否会造成 Circular Dependency；
- 是否只是为了拆文件而拆 Module。

不得为了形式上的“分层”增加没有实际职责的 Architecture Layer。

## 4. Module Dependency

Dependency 应通过明确 Public Interface / Export 建立。

禁止：

- Circular Dependency；
- 为规避 Circular Dependency 滥用 `forwardRef()`；
- Module 直接访问其他 Module 的内部实现；
- 重复实现已有跨模块能力；
- 创建与 Existing Infrastructure 平行的第二套实现。

`forwardRef()` 只能用于确有设计依据的场景，不得作为默认解决 Circular Dependency 的方式。

跨模块共享能力应优先复用 Existing Public Service / Abstraction。

## 5. DTO and Validation

HTTP、External Service、LLM、Tool 等 Boundary 输入均不得默认可信。

Request Input 应通过项目 Existing Validation Mechanism 完成：

- Shape Validation；
- Type Validation；
- Required Field Validation；
- Necessary Business Boundary Validation。

DTO 用于 Transport Boundary，不承担核心 Business Logic。

不得直接使用 Persistence Entity 作为外部 Request DTO。

外部 API Response、LLM Output 和 Tool Result 在进入 Business Logic 或 Persistence 前应进行必要 Validation / Parsing。

## 6. Persistence

Persistence 使用 PostgreSQL + MikroORM。

具体 MikroORM 通用实践优先遵循 Approved Skill / 官方资料；项目特有 Entity、Relation、Migration 和 Transaction 规则以 Backend docs 为准。

### Persistence Boundary

- Controller 不直接操作 EntityManager / Repository；
- Persistence Logic 不散落在 HTTP Layer；
- Entity 不承担 External Service 调用；
- 不通过直接 SQL 绕过 Existing Persistence Abstraction，除非 Requirement 或 Performance Evidence 明确要求。

修改 Entity、Relation、Constraint 或 Schema 时，应检查：

- Existing Data Compatibility；
- Migration Requirement；
- Unique / Foreign Key / Index；
- Nullability；
- Delete / Update Behavior；
- Related Business Rule。

Schema Change 不得仅修改 Entity 而忽略 Migration / Existing Data 影响。

## 7. Transaction

需要多个 Persistence Operation 保持原子性时，应评估 Transaction Boundary。

Transaction 应围绕完整 Business Operation，而不是围绕单个 Repository Call。

不得为了“安全”给所有 Service Method 默认增加 Transaction。

涉及 External API / LLM / Tool 调用时，不应无必要长时间持有 Database Transaction。

## 9. API Contract

Root `docs/api/` 是 Frontend / Backend Cross-boundary Contract 的正式来源。

修改以下内容属于 Contract Change：

- Route；
- HTTP Method；
- Request；
- Response；
- Status Code；
- Error Code；
- Authentication Requirement；
- Authorization Requirement。

Contract Change 必须检查对应 Frontend Consumer。

不得仅根据 Backend Existing Implementation 单方面定义新的 API Behavior。

## 10. Error Handling

使用项目 Existing Exception / Error Mapping Mechanism。

Backend Error 应：

- 保留必要 Error Context；
- 对 Client 返回稳定、可理解的 Error Contract；
- 避免暴露 Stack、Credential、Database Detail 等 Internal Information。

禁止：

- Empty Catch；
- Silent Failure；
- 忽略 Promise Rejection；
- 将所有异常统一转换为无 Context 的 Generic Error；
- 重复在多个 Layer Catch 同一错误。

只有当前 Layer 能增加 Context、Recovery 或正确 Mapping 时才处理 Error。

## 11. AI and Tool Integration

AI Agent、Business Module、Tool 与 External Service 应保持明确边界。

Tool 应通过项目 Existing Tool Abstraction / Registry 使用。

不得：

- 在不同 Business Module 中复制 Tool 内部逻辑；
- 在业务代码中重复实现 External API Client；
- 将 External Credential 暴露给 LLM；
- 默认信任 LLM Output；
- 使用 Hard-coded LLM Result 冒充完整功能。

业务模块显式调用 Tool 时，应使用 Existing Tool Interface，而不是绕过 Tool System 直接复制 Integration Logic。

涉及 Agent Tool Selection 时，应遵循 Root AI / Tool Architecture 文档。

## 13. Validation

具体 Validation 方法优先遵循 Approved Skill、Existing Script 和当前 Requirement。

最低原则：

| Change                      | Validation Focus                        |
| --------------------------- | --------------------------------------- |
| Controller / API            | Type / Lint + Related Integration / E2E |
| Service / Business Logic    | Type / Lint + Related Test              |
| Entity / Persistence        | Type + Migration / Integration          |
| Authentication              | Integration / E2E + Security Path       |
| Authorization               | Permission / Forbidden Path             |
| API Contract                | Backend + Frontend Consumer             |
| Tool / External Integration | Success + Error Path                    |
| Agent Logic                 | Tool Selection / Integration Behavior   |

Validation 应同时覆盖必要的：

- Happy Path；
- Invalid Input；
- Not Found；
- Permission / Authentication Failure；
- External Dependency Failure；

具体覆盖范围按当前 Requirement 和风险决定，不机械追求固定测试数量。

未实际执行的 Validation 不得报告为 PASS。

## 14. Backend-specific Prohibited Actions

除 Root `AGENTS.md` 中的禁止事项外，Backend Scope 额外禁止：

- Controller 直接访问 Database；
- 使用 Entity 替代 Request DTO；
- 通过 `forwardRef()` 掩盖无必要 Circular Dependency；
- 绕过 Existing Authentication / Authorization Boundary；
- Schema Change 不考虑 Migration；
- 将 LLM / External API Output 直接持久化而不经过必要 Validation；
- 为实现单个 Requirement 自行重构整体 Backend Architecture；
- 因通用 Best Practice 与现有实现不同，就在无 Requirement 情况下主动重写 Existing Module。
