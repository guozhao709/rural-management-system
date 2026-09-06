# Frontend Agent 规范

本目录为“智乡云”Frontend Application。

本文件定义 Frontend Scope 下的 Agent Policy。执行 Frontend Task 时，应同时遵循：

`根 AGENTS.md + nest_front/AGENTS.md + 相关 docs + Approved Skill`

根目录已定义的 Git、Completion、Security、Workflow 等公共规则，本文件不重复。

核心技术栈：`/nest_front/docs/technologyStack/index.md`。

## 1. Frontend Scope

Frontend 主要负责：

* User Interface；
* User Interaction；
* Routing；
* Client-side State；
* API Consumption；
* User-visible Feedback；
* Frontend Data Presentation；
* Frontend Input Validation。

Frontend 不负责：

* Backend Business Rule；
* Persistence；
* Authentication / Authorization Security Boundary；
* Server-side Data Integrity；
* Backend External Service Integration。

不得依赖 `nest_server/` Source Code，也不得通过 Frontend Logic 替代 Backend Security 或 Business Validation。

## 2. Source of Truth

Frontend Task 开始前，根据 Scope 读取对应正式文档。

### Source Map

| Domain                         | Source                     |
| ------------------------------ | -------------------------- |
| core technology stack          | `nest_front/docs/technologyStack/index.md` |
| module structure               | `nest_front/docs/srcSturcture/index.md` |
| UI standards                   | `nest_front/docs/ui/index.md` |
| validation                     | `nest_front/docs/validation/index.md` |

若文档不存在，不得自行假设其内容。

Vue、TypeScript、Testing 等通用工程实践优先使用 Approved Skill，不在本文件重复定义。

## 4. Module and Dependency

遵循 Existing Frontend Structure。

`/nest_front/docs/srcSturcture/index.md` 定义了 Frontend Module 结构、职责边界和依赖方向。

新增：

* Page；
* Feature；
* Component；
* Composable；
* Store；
* Service；
* Util；
* Shared Module；

前，应先确认是否已有同职责实现。

禁止：

* Feature 间直接依赖对方 Internal Implementation；
* Shared Layer 依赖具体 Page / Feature；
* 创建重复 API Client；
* 创建职责重复的 Store / Composable / Util；
* 通过 Global State 规避合理的 Component / Module Boundary；
* 为避免合理的数据传递而过早引入全局机制。

只有存在稳定、真实的复用边界时，才将实现提升到 Shared Scope。

## 5. API Boundary

Frontend 与 Backend 通过 Root `docs/api/` 定义的正式 API Contract 通信。

API Request 不应散落在：

* Page；
* Component；
* Store；
* Event Handler；

等任意位置。

应通过 Existing API Client / Service Abstraction 发起请求。

不得：

* 直接依赖 Backend Entity；
* 直接 import Backend DTO；
* 根据 Backend Internal Implementation 推断 Response；
* 为修复 Frontend 临时适配而静默改变正式 Contract。

API Contract Change 必须检查对应 Backend Provider。

## 6. Data and Type Safety

新增或修改 Frontend TypeScript 应保持 Type Safety。

优先使用：

* Existing Domain Type；
* API Contract Type；
* Component Props Type；
* 明确的数据模型。

以下数据均不得默认可信：

* API Response；
* User Input；
* Route Parameter；
* Storage Data；
* External Data；
* AI / LLM Result。

必要时应在对应 Boundary 完成：

* Validation；
* Parsing；
* Normalization；
* Type Narrowing。

不得通过大量 `any`、不必要 Type Assertion 或 Error Suppression 解决类型问题。

## 10. UI and Interaction

`/nest_front/docs/ui/index.md` 定义了 User UI 与 Admin UI 的主要设计方向。

UI Change 应优先遵循：

1. 当前任务的明确 Requirement；
2. 适用的根目录与 Frontend `AGENTS.md` 约束；
3. 已确认的 UI Architecture Decision；
4. 对应 User / Admin 的正式 UI docs；
5. 符合上述规范的 Existing Design System、Component 与 Interaction Pattern；
6. Approved UI / Vue Skill。

正式 UI docs 定义目标，Existing Implementation 用于复用与理解现状。二者冲突时以正式 UI docs 为准；当前任务明确要求覆盖规范时，以当前 Requirement 为准，并说明影响范围。不得以复用旧页面为由延续不符合规范的 UI。

不得因为局部 Requirement：

* 重做整体视觉风格；
* 创建平行 Design System；
* 替换现有 UI Library；
* 大范围修改无关页面。

新增 UI 前先检查 Existing Component 是否可以合理复用或扩展。

User-visible Error、Loading、Empty State 和 Success Feedback 应与当前功能风险和交互需求相匹配。

## 11. Error Handling

Frontend 应使用 Existing Error Handling Mechanism。

应区分：

* User Input Error；
* Authentication / Authorization Error；
* Business Error；
* Network Error；
* Server Error；
* External Dependency Error。

禁止：

* Empty Catch；
* Silent Failure；
* 所有错误统一显示同一个无意义提示；
* 重复在多个 Layer 展示同一 Error；
* 将 Backend Internal Error Detail 直接暴露给用户。

只有当前 Layer 能提供额外 Context、Recovery 或 User Feedback 时才处理 Error。

## 12. AI-related Frontend

AI Response、Tool Result 或 Streaming Content 不得默认具有稳定结构。

涉及 AI Feature 时，应遵循 Root AI / Tool Architecture 和对应 Frontend Design。

Frontend 负责：

* AI Interaction UI；
* Loading / Streaming State；
* User Input；
* Structured Result Presentation；
* Error / Retry Feedback。

Frontend 不负责：

* Agent Tool Selection；
* Prompt Security Boundary；
* Tool Execution；
* LLM Credential；
* Server-side AI Business Rule。

不得为了演示效果在正式业务路径中 Hard-code AI Result 冒充真实 Implementation。

## 13. Skills Policy

Frontend 默认优先使用 Project-approved Vue / Frontend Skills。

Skill 可负责：

* Vue 通用工程实践；
* Component Design；
* Composition API；
* Frontend Testing；
* UI Implementation；
* Performance；
* Accessibility；
* TypeScript 通用规范。

具体 Approved Skill 与 Trigger 以 Root `docs/skill-list/index.md` 为准。

不要同时加载职责明显重叠的 Skill。

Skill 中已有的 Vue / TypeScript 通用规范不复制进本文件。

## 14. Validation

Validation 是证明 Requirement 正确实现的 Evidence。执行最小充分、与风险相称的检查；Static Check 不能替代必要的 User-visible Runtime / Browser Verification。不得通过削弱 Quality Gate 获得 PASS。

命令、环境要求及 Conditional 检查的触发条件见 `nest_front/docs/validation/index.md`。根目录安装与应用入口见 `docs/development/index.md`。

| Change Type | Required | Conditional |
| --- | --- | --- |
| Documentation | 内容与引用检查 | 文档专项检查 |
| TypeScript / Vue Source | Type Check + Lint | Related Test |
| Pure Logic / Utility | Type Check + Lint | Unit / Regression Test |
| UI / Interaction | Type Check + Lint | Browser Verification + Related Test |
| Shared Component / Logic | Type Check + Lint | Regression Test + Browser Verification |
| Routing / Lazy Loading | Type Check + Lint | Build + Browser Verification |
| Dependency Change | Type Check + Lint + Build | Related Test + Runtime Verification |
| Build / Tooling Configuration | Build | Type Check + Runtime Verification |
| Security-sensitive Change | Applicable Static Check | Related Test + Security Review |

- 命令以项目实际 `package.json` 和正式文档为准。优先运行 Related Test；可稳定复现的 Bug Fix 应补充或更新 Regression Test。影响 Shared Logic、Public API 或多模块行为时，执行与影响面相称的 Regression Validation。
- Current Change Failure：修复后重新验证。Existing Failure：不扩大 Scope，确认未新增影响并如实报告。Unknown Failure：不猜测归因，保留 Error Context，并标记为 `FAIL` 或 `BLOCKED`。
- 状态仅可为：`PASS`（实际执行且成功）、`FAIL`（实际执行但失败）、`NOT RUN`（未执行）、`BLOCKED`（因环境、能力或 Dependency 等无法执行）。`NOT RUN` 与 `BLOCKED` 不得表述为 PASS。

## 15. Frontend-specific Prohibited Actions

除 Root `AGENTS.md` 中的禁止事项外，Frontend Scope 额外禁止：

* 直接依赖 Backend Source Code；
* 在 Component / Page 中散落重复 API Request Logic；
* 用 Frontend Validation 替代 Backend Validation；
* 用隐藏 UI 替代 Backend Authorization；
* 无必要将 Local State 提升为 Global State；
* 为少量复用创建过度 Shared Abstraction；
* 未经 Requirement 替换 Existing UI / State / Router / HTTP Infrastructure；
* 为实现单个 Feature 主动重构整体 Frontend Architecture；
* 因通用 Best Practice 与 Existing Implementation 不同，就无 Requirement 地重写 Existing Module。
