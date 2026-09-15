<!-- Inherits from: ../AGENTS.md -->
<!-- Only Frontend-specific additions are defined here. -->

# Frontend Agent Policy

## Scope

Frontend 负责 UI、交互、路由、Client State、API Consumption、数据展示和用户反馈。

Frontend 不负责 Backend Business Rule、Persistence 或服务端安全边界。

## Sources

开始 Frontend 任务前，按范围读取：

- `docs/module/index.md`
- 当前模块 Requirement、Design 和 API Contract
- `nest_front/docs/technologyStack/index.md`
- `nest_front/docs/srcSturcture/index.md`
- `nest_front/docs/ui/index.md`
- `nest_front/docs/validation/index.md`

## Boundaries

- 不依赖或导入 `nest_server/` Source Code、Entity 或 DTO。
- API Request 使用现有 Client/Service abstraction，不散落在 Page、Component、Store 或 Event Handler。
- 不用 Frontend Validation 或隐藏 UI 替代 Backend Validation/Authorization。
- 不根据 Backend 内部实现推导 Response 或修改 Contract。
- Contract Change 必须检查 Backend Provider。
- 仅在存在稳定复用边界时提升为 Shared Component、Composable、Store 或 Util。
- 局部需求不得替换现有 UI Library、Design System、Router、State 或 HTTP Infrastructure。
- API、Storage、Route、User Input 和 AI Result 在使用前进行必要校验与收窄。
- 正式业务路径不得使用硬编码 AI Result 冒充真实能力。

## Legacy

现存农业和健康页面是冻结的 Nest 旧业务 Consumer。新 Design 和 Contract 批准前，不继续扩展，也不据此推导新业务 UI。

## Validation

具体命令和条件见 `nest_front/docs/validation/index.md`。

- TypeScript/Vue 变更至少执行适用的 Type Check 和 Lint。
- Pure Logic、Shared Logic 和 Bug Fix 运行相关测试。
- UI、Interaction、Routing 变化按风险执行 Browser Verification。
- Static Check 不能替代必要的用户可见运行时验证。
- Contract Change 同时验证 Backend Provider。
