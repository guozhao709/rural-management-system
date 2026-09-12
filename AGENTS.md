# 智乡云项目级 Agent 规范

本项目为“智乡云”农业、健康与 AI 智能服务平台。

根目录 `AGENTS.md` 是项目级 Agent Operating Policy、Source of Truth 索引和 Scope Routing 入口；Frontend、Backend 的具体规则由各自目录下的 `AGENTS.md` 定义，详细 Architecture、Module Design、API Contract 等以对应 `docs/` 中正式文档为准。

## 1. Project Scope

Repository 主要结构：

`\front-end` 与 `\servers` 是旧项目，只读。

`nest_front` 与 `nest_server` 是新项目(从旧项目重构)，Agent 可读写。

职责划分：

* `docs/`：系统级、业务级及 Frontend / Backend 跨边界文档；
* `nest_front/AGENTS.md`：Frontend Agent Policy；
* `nest_front/docs/`：Frontend-specific Architecture、Design 与项目特有规范；
* `nest_server/AGENTS.md`：Backend Agent Policy；
* `nest_server/docs/`：Backend-specific Architecture、Design 与项目特有规范。

不要为了目录对称创建没有实际内容的文档。

## 2. Technology Stack

优先使用既有技术栈；除非 Requirement 明确要求或现有能力无法合理满足需求，不得自行引入同类替代方案或更换核心 Technology Stack。

前端技术栈确认：`nest_front/AGENTS.md` 中确认。

后端技术栈确认：`nest_server/AGENTS.md` 中确认。

具体版本和 Dependency 以实际 `package.json`、Lockfile 及正式项目文档为准。

新增重要 Dependency 不由 Agent 自行决定。确有必要时，应说明必要性、Existing Solution 限制、Candidate、Recommendation 与 Impact，交由用户决定。

Requirement 不涉及 Dependency 时，不修改 Dependency Manifest 或 Lockfile。

## 3. Source of Truth

非简单任务开始前，根据任务 Scope 读取对应正式文档；不要仅凭 Existing Implementation、通用 Best Practice 或 Assumption 推断项目规范。

### Source Map

| Domain                         | Source                     |
| ------------------------------ | -------------------------- |
| Frontend Policy                | `nest_front/AGENTS.md`     |
| Frontend Design / Standards    | `nest_front/docs/`         |
| Backend Policy                 | `nest_server/AGENTS.md`    |
| Backend Design / Standards     | `nest_server/docs/`        |
| API Contract                   | `docs/接口文档/`           |
| Development / Validation Entry | `docs/development/index.md` |
| Agent Environment Decisions    | `docs/agent/environment-decisions.md` |

信息冲突时按以下优先级处理：

1. 当前明确 Requirement；
2. 当前作用域的 `AGENTS.md`；
3. 已确认的 Architecture Decision；
4. 正式 Architecture、Module Design、API Contract 或其他项目文档；
5. Existing Implementation；
6. Agent Assumption。

Existing Implementation 是理解当前行为的 Evidence，不自动等于目标 Architecture 或完整 Requirement。

发现冲突时遵循更高优先级来源；涉及 Architecture、API Contract、Security、Authentication、Authorization、Persistence 或 Dependency 时，应明确报告，不要静默选择。

## 4. Scope and Boundaries

任务开始前识别其 Scope，包括但不限于：

* Frontend
* Backend
* Cross-boundary
* Database
* Authentication / Authorization
* AI / Tool
* Architecture
* Documentation

Frontend Task 应同时遵循：

`根 AGENTS.md + nest_front/AGENTS.md + 相关 Frontend / Root docs`

Backend Task 应同时遵循：

`根 AGENTS.md + nest_server/AGENTS.md + 相关 Backend / Root docs`

### Frontend / Backend Boundary

* Frontend 与 Backend 是独立 Application Boundary，即使位于同一 Repository，也不得直接依赖对方 Source Code。
* Frontend 与 Backend 通过正式 API Contract 通信。
* Frontend 不负责 Backend Business Rule、Persistence 或 Security Boundary。
* Backend 不依赖 Frontend Source Code，也不得依赖 Client-side Validation 保证安全。
* API Contract Change 必须同时检查 Provider 与 Consumer。

新增/删除顶层 Layer、改变 Module Responsibility 或 Dependency Direction、修改 Public Contract、Authentication Architecture、Persistence Strategy、AI Agent Architecture 或 Tool System Architecture，属于 Architecture Change，必须有明确 Requirement 或 Project Decision 支持。

## 5. Development Rules

* 采用 Minimum Complete Change：完整解决 Requirement，但不顺带重构、格式化、重命名、升级 Dependency 或改变无关 Public API / Behavior。
* 新增实现前先检查 Existing Implementation 与可复用能力，不创建仅名称不同的 Parallel Abstraction。
* 新增或修改 TypeScript 应保持 Type Safety；外部 Input、External API、LLM Output 与 Tool Result 不得默认可信，应在对应 Boundary 完成 Validation。
* 不使用 Mock、Stub、Placeholder、Hard-coded Result 或未说明 TODO 冒充完整 Requirement。
* 具体 Vue、NestJS、MikroORM、Testing 等通用工程实践优先遵循当前作用域的 Approved Skill；项目特有规则以 `AGENTS.md` 和正式 docs 为准。

## 6. Completion Integrity

不得仅因为 Code 已生成、Compile 成功、Endpoint 存在或 Happy Path 可运行，就声明 Feature 已完成。

功能状态统一使用：

* `NOT IMPLEMENTED`：尚未实现；
* `PARTIAL`：仅部分满足 Requirement；
* `IMPLEMENTED`：实现已存在，但尚未完成要求的 Validation；
* `VERIFIED`：Requirement 已实现且要求的 Validation 已实际通过；
* `BLOCKED`：存在明确 Blocker。

不得将 `IMPLEMENTED` 表述为 `VERIFIED`，也不得隐藏已知 Failure 或未完成 Requirement。

## 7. Skills Policy

Skill 是 Execution Guidance，不是 Source of Truth；其内容不得覆盖 Requirement、`AGENTS.md`、Architecture Decision 或正式项目文档。

* Approved Skill、职责与 Trigger 见 `docs/skill-list/index.md`。
* 默认只自动选择 Approved Skill。
* 根据 Requirement 和 Scope 选择完成任务所需的最小 Skill 集合。
* 简单、局部任务可以不使用 Skill。
* 多个 Skill 应分别承担不同子问题，避免职责重叠。
* 如 Skill 已包含的通用技术规范、Workflow 或 Validation Guidance，但 在 `AGENTS.md` 和项目 docs 中有类似的定义，以项目中的定义为准。
* Skill 与项目规则冲突时，以项目规则为准。
* 所需 Skill 不可用时，不伪造其结果；如影响实现或验证，应明确报告。

## 8. Workflow

默认流程：`Understand → Inspect → Plan → Implement → Validate → Review → Report`。流程深度应与 Complexity 和 Risk 匹配；发现新事实时可回到 Inspect 或 Plan。

1. **Understand**：确认 Requirement、Expected Behavior、Change Scope、非目标范围与任务类型。
2. **Inspect**：阅读适用规则和 Source of Truth，检查 Related Existing Implementation、可复用能力及 Impact Scope；避免无目的的 Repository Exploration。
3. **Plan**：Non-trivial Task 在实现前明确主要修改位置、复用能力、实施方式和必要 Validation；Simple Task 可省略 Formal Plan。
4. **Implement**：遵循 Architecture、Development Rules、正式项目文档和适用 Skill，保持 Minimum Complete Change。
5. **Validate**：按本文件的 `Validation` 章节执行与风险匹配的检查。
6. **Review**：检查 Final Diff 是否满足 Requirement，是否混入无关改动、意外 Public API / Behavior 变更、Debug/Temporary Code、无必要 Dependency/Abstraction，以及明显的 Boundary、Type Safety 或 Error Handling 问题。
7. **Report**：说明完成内容、实际 Validation 结果，以及 Blocker、Risk 或 Assumption。未完成时明确已完成部分和限制。

未授权 Git 操作时，修改前记录本任务涉及的文件和必要的原始内容，修改后基于文件前后内容审查。不得覆盖用户已有改动，或将任务开始前已存在的内容计入本次成果。基线记录不得包含真实敏感数据。

## 9. Validation

Validation 是证明 Requirement 正确实现的 Evidence。

具体 Validation 方法优先遵循：

1. 当前 Requirement；
2. 当前作用域 `AGENTS.md`；
3. Approved Skill；
4. 项目 Existing Script 与 Test。

Cross-boundary Change 必须同时检查受影响的 Frontend Consumer 与 Backend Provider。

Validation 状态仅可为：

* `PASS`：实际执行且成功；
* `FAIL`：实际执行但失败；
* `NOT RUN`：未执行；
* `BLOCKED`：因环境、Dependency 或其他条件无法执行。

未实际执行的 Test、Build、Lint、Type Check、Browser Verification、Integration、E2E 或 Security Review 不得报告为 PASS。

不得通过删除 Test、弱化 Assertion、关闭 Lint Rule、降低 TypeScript Strictness、Error Suppression 或修改 Validation Configuration 来获得 PASS。

## 10. Git Policy

**所有 Git 操作由用户控制。**

Agent 不执行任何 Git 命令或 Git 写操作。

不得以检查 Change、恢复文件、获取 Clean Working Tree 或其他理由自行操作 Git。

需要说明修改内容时，应基于实际文件和当前任务进行 Review，不依赖 Git Command。

只有当用户通过提示词明确下达git操作指令时，Agent 才可进行git操作。

## 11. Prohibited Actions

* 不写入或输出真实 Credential、Secret、Token、Password、Cookie、Authorization Header 等 Sensitive Data。
* 不绕过 Authentication / Authorization Boundary。
* 不主动扩大 Requirement Scope。
* 不仅因静态搜索未发现引用就删除 Existing File、Configuration、Asset、Migration 或 Resource。
* 不自行建立新的项目级 Convention、Architecture 或核心 Dependency Decision。
* 未经明确 Requirement，不执行 Deploy、Publish、Release、Production Migration 或 Shared Environment Modification。
* 不伪造或夸大 Implementation、Validation、Review 或 Completion Status。

## 12. Reporting

完成任务后应简要说明：

* 实际完成内容；
* 实际执行的 Validation 及结果；
* 未完成项；
* 已知 Risk / Blocker；
* 必要 Assumption。

无 Failure、Risk 或 Blocker 时无需为了固定格式制造内容。
