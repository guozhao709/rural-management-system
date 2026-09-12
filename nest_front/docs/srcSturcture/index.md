# `src/` Structure Overview

本项目采用多 SPA 组织。新前端位于 `nest_front/`，每个 SPA 是独立应用，遵循下方统一的 `src/` 结构。

```text
nest_front/
├── admin/                  # 管理员端 SPA
├── users/                  # 用户端 SPA
└── docs/                   # 前端工程与 UI 规范
```

当前 SPA 根目录为 `nest_front/admin/` 和 `nest_front/users/`。新增 SPA 需要明确需求，并在 `nest_front/` 下组织；不得自行创建平行的 `apps/` 目录或在 Repository Root 放置前端入口和 `src/`。

下方规则分别适用于两个 SPA 的 `src/`，不改变其内部 Architecture。跨 SPA 的业务共享能力只有在存在稳定复用边界、且共享位置与接口经确认后才提取；不得直接导入另一个 SPA 的内部文件。通用工程配置可在 `nest_front/` 层集中维护。

## SPA `src/` Structure

```text
src/
├── main.ts
├── App.vue
├── app/
│   ├── bootstrap.ts
│   └── config.ts
├── api/
│   ├── request.ts
│   ├── error.ts
│   └── types.ts
├── router/
│   ├── index.ts
│   ├── routes.ts
│   └── guards/
│       ├── auth.ts
│       └── permission.ts
├── stores/
│   ├── user.ts
│   ├── permission.ts
│   └── app.ts
├── layouts/
│   ├── DefaultLayout.vue
│   └── components/
├── assets/
├── shared/
│   ├── components/
│   ├── composables/
│   ├── utils/
│   ├── constants/
│   ├── services/
│   └── types/
├── styles/
│   ├── index.scss
│   ├── reset.scss
│   └── variables.scss
├── types/
│   └── global.ts
└── views/
    └── <feature>/
        ├── index.vue
        ├── assets/
        ├── components/
        ├── api/
        ├── services/
        ├── composables/
        ├── stores/
        ├── types/
        ├── utils/
        └── constants/
```

`views/<feature>/` 内目录按实际需要创建，不要求为了匹配模板建立空目录。

## Module Responsibilities

| 位置 | 职责 | 不应放置 |
| --- | --- | --- |
| `main.ts` / `App.vue` | 挂载 Vue App、注册应用级 Provider 和根级组合 | Feature 业务逻辑、HTTP 请求、WebSocket 协议处理 |
| `app/` | 启动顺序、应用初始化、应用配置 | 页面或 Feature 私有逻辑 |
| `api/` | Axios Instance、通用请求/响应与错误处理、通用 Transport Type | Feature Endpoint、页面数据转换、UI 状态 |
| `router/` | Route Record、Lazy Loading、Navigation Guard、路由级权限控制 | 页面业务逻辑、Feature 内部状态 |
| `stores/` | 用户、权限、应用级和跨页面长期状态 | 单个 Feature 或 Component 的临时状态 |
| `layouts/` | 应用壳、通用导航和页面布局 | 特定 Feature 的业务 UI 或业务流程 |
| `assets/` | 由构建工具打包、可跨 Feature 复用的静态资源 | 用户上传文件、后端动态资源或 Feature 私有资源 |
| `shared/` | 稳定且跨 Feature 复用的 Component、Composable、Utility、Constant、Service、Type | Feature 业务规则、页面私有协议或页面专用状态 |
| `styles/` | Reset、全局变量、全局样式入口 | Feature 专属样式；其样式应与 Feature 或 Component colocate |
| `types/` | 全局声明和全局扩展 Type | Feature Domain Type 或 API DTO |
| `views/<feature>/` | 完整的 Feature 业务实现与其私有依赖 | 其他 Feature 的实现细节或应用级基础设施 |

## Dependency Boundaries

依赖总体从具体业务模块指向通用稳定模块：

```text
main.ts / App.vue
        ↓
app · router · layouts
        ↓
views/<feature>
        ↓
Feature-private modules → shared · api · stores
```

- `api/`、`shared/`、根级 `stores/`、`layouts/` 不得依赖 `views/<feature>/` 的内部实现。
- `views/<feature>/` 可依赖自己的私有模块和根级公共模块；不得直接导入其他 Feature 的内部文件。
- Feature 间协作应通过已声明的 Public Export、根级 Store、Route 参数或稳定 Shared Abstraction 完成；不得形成 Feature-to-Feature 的隐式依赖。
- `router/routes.ts` 可以引用 Feature 的页面入口以注册路由，但不应了解 Feature 内部 Component、Store、Service 或 Type。
- 不得通过动态 `import`、移动 Import 位置或重复实现来掩盖 Circular Dependency。

## Feature-private Modules and Promotion

`views/<feature>/` 内的 `components`、`api`、`services`、`composables`、`stores`、`types`、`utils`、`constants` 默认均为 Feature-private。

- 其他 Feature 只能依赖该 Feature 明确导出的 Public API；默认不允许跨 Feature 导入其内部路径。
- API Endpoint、HTTP DTO 和数据转换优先放在所属 Feature。根级 `api/` 只提供 HTTP Infrastructure；交互流程、连接生命周期和状态协调分别放在所属 Feature 的 Composable、Service 或 Store。
- 只有能力被多个 Feature 真实使用、职责稳定、接口清晰且不依赖任一 Feature 时，才可提升到本 SPA 的 `shared/`；跨 SPA 提取还需确认共享位置和 Public Interface。
- 不得因少量相似代码、预测性复用或跨 Feature 调用方便而提前提升；提升后 Shared Module 仍不得反向依赖任一 Feature。

## API and Service Boundaries

HTTP 请求必须遵循：

```text
Vue Component / Composable
        ↓
Feature API Module
        ↓
Root Axios Request Layer
        ↓
Backend API
```

- Component 不直接散落 Axios 调用；Feature `api/` 负责 Endpoint、Feature DTO 与业务数据转换，根级 `api/` 负责 Axios、拦截器、HTTP 状态码和统一 Error Handling。
- `services/` 用于非 HTTP Transport 或业务协调，如 WebSocket、连接管理和多 API 调用编排；不要把单个 HTTP Endpoint 包装为 Service。
- `shared/services/` 只能容纳不含 Feature 业务语义的稳定通用能力；带有具体业务协议语义的 Service 必须留在所属 Feature。

## State Boundaries

- 根级 `stores/` 仅保存用户、权限、应用级状态、跨页面共享状态和需要跨页面长期保留的任务状态。
- `views/<feature>/stores/` 仅保存该 Feature 内多个 Component 或子页面共同使用的复杂状态；不保存全局用户、权限或其他 Feature 状态。
- 单一 Component 内的临时状态优先使用 `ref`、`reactive`、`computed`，不要为简单局部状态创建 Pinia Store。
- 同一 Domain 数据应有明确的单一 State Owner；避免同时在 Component、Feature Store 和根级 Store 保存互相独立的副本。

## Type Boundaries

| 位置 | 放置内容 | 使用边界 |
| --- | --- | --- |
| `src/types/` | 全局声明、Vue / Vite 环境扩展和应用范围的 Type | 不放置 Feature Domain Type 或 API DTO |
| `src/shared/types/` | 稳定且跨 Feature 复用的 Domain Type | 不得依赖任一 Feature 的 Endpoint、Store 或业务规则 |
| `src/api/types.ts` | 通用 HTTP Transport Type，如分页、通用响应和错误结构 | 不放置具体业务 Feature DTO |
| `src/views/<feature>/types/` | Feature Domain Type、HTTP DTO、WebSocket 消息 Type 和 UI 专用 Type | 默认 Feature-private，不得被其他 Feature 直接导入 |

- 同一 Domain Concept 只保留一个权威 Type。DTO、Domain Type 与 UI View Model 语义不同，应显式转换，不得以 `any` 或 Type Assertion 混用。
- API 请求/响应、WebSocket 消息、Pinia State/Getter/Action、Component Props/Emits 都必须使用明确 Type。
- 只有 Type 被多个 Feature 真实复用且不包含任一 Feature 语义时，才可从 Feature `types/` 提升到 `shared/types/`。

## App Configuration and Environment

`src/app/config.ts` 是前端 Runtime Configuration 的唯一读取和导出入口。

- `config.ts` 只暴露经过类型化和启动期 Validation 的非敏感配置，例如 API / WebSocket Base URL、应用名称、Feature Flag 和超时值。
- 其他 `src/` 模块不得直接读取环境变量；应依赖 `config.ts` 导出的配置，避免环境键名和默认值散落。
- 前端构建产物中的环境值并非 Secret。Password、Private Key、长期 Token 等 Credential 不得写入前端环境配置或经由 `config.ts` 暴露。
- 环境文件、构建工具配置和具体注入方式属于 SPA 外层工具链，不由本目录结构固定；其声明 Type 与 `config.ts` 必须保持一致。

## Router and Layout Boundaries

- `router/routes.ts` 只维护 Route Record、页面入口和 Lazy Loading；每个 Route 只引用所属 Feature 的 `index.vue` 页面入口。
- `router/guards/` 只处理认证、权限和应用级导航规则，可依赖根级用户/权限 Store 与公共服务；不得读取或修改 Feature-private Store、Service 或 Component。
- Route 参数、Query 与导航结果是 Feature 之间允许传递的公开数据；Feature 间业务协作不得通过访问彼此内部 Router 逻辑实现。
- `layouts/` 负责应用壳、通用导航、`RouterView` 容器和全局布局状态，可依赖 `shared/` 与根级 Store；不得导入特定 Feature 的业务 Component、Service、Store 或 Type。
- Feature 页面负责在 Layout 的 `RouterView` 中完成业务组合。Layout 不负责发起 Feature API 请求或管理 Feature WebSocket 连接。

## Test Organization

- Unit、Composable 与 Component Test 与被测源文件 colocate，使用 `*.spec.ts` 或 `*.spec.tsx` 命名；测试仅覆盖可观察行为，不为纯 Type、常量或静态数据单独建立无价值测试。
- Feature Test 默认位于所属 `views/<feature>/` 内；Shared Test 位于所属 `shared/` 内。Test 可以使用本 Feature 的私有实现，但不得通过跨 Feature 内部 Import 构建测试依赖。
- 影响 Shared Component、Shared Logic、Public API 或跨 Feature 行为的 Change，应补充与影响面匹配的 Regression Test。
- Browser E2E 的 Runner、配置、Fixture 与文件位置属于 SPA 外层测试基础设施，本文件不预设目录；其场景应以公开 Route 和用户可见行为为边界，不依赖 Feature 内部实现。

## Assets and Naming

### Assets

- `src/assets/` 放置由构建工具打包、在多个 Feature 中复用的图片、字体、图标和其他静态资源；在代码中通过 Import 引用。
- `views/<feature>/assets/` 放置仅供该 Feature 使用的静态资源；资源被多个 Feature 真实复用后，才可提升到 `src/assets/`。
- 用户上传文件、后端生成文件和运行时远程资源不属于 `src/assets/`，应通过后端地址或业务数据模型管理。
- 本 Architecture 不固定 SPA 外层静态目录。若实际工具链提供 `public/`，仅放置需要以固定 URL 直接访问且不经构建处理的文件；不得将可 Import 的应用资源随意放入其中。

### Naming

| 对象 | 约定 | 示例 |
| --- | --- | --- |
| Feature、业务目录、普通文件 | `kebab-case` | `views/example-feature/`、`record-status.ts` |
| Vue Component 文件与组件名 | `PascalCase` | `RecordPanel.vue`、`<RecordPanel />` |
| Feature 页面入口 | `index.vue` | `views/example-feature/index.vue` |
| Composable | `use` + `PascalCase` | `useRealTimeData.ts`、`useRealTimeData()` |
| Pinia Store | 文件使用业务名；导出 `use` + `PascalCase` + `Store` | `records.ts`、`useRecordsStore()` |
| Type / Interface / Enum | `PascalCase` | `RecordStatus`、`RecordMessage` |
| Function、变量、API 方法 | `camelCase` | `fetchRecordStatus()`、`submitRecord()` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RECONNECT_ATTEMPTS` |

- Feature 名称、Route Name、Store 名称、Type 和 API Module 应使用同一业务词汇，避免同一概念出现不必要的同义命名。
- `index.ts` 仅用于声明目录的明确 Public Export；不得为每个目录机械创建 Barrel File，也不得通过 Barrel File 暴露 Feature-private 实现。
- 缩写应保持通用且一致。若名称无法仅凭文件名理解，应优先选择完整业务词而不是不透明缩写。

## Realtime Communication Lifecycle

普通 CRUD 和配置读取使用 HTTP。需要实时通信时，根据已确认的 API Contract 选择协议；采用浏览器原生 `WebSocket` 的 Feature 遵循下方生命周期边界，不因本节存在而默认建立实时连接。

```text
Feature Component
        ↓
Feature Composable (lifecycle)
        ↓
Feature Service (connection / protocol)
        ↓
Feature Store or local reactive state
```

- 一个实时 Feature 的连接由其 `services/` 中的 Service 统一创建、发送、重连和关闭；Component 不直接创建 `WebSocket` 或处理原始协议消息。
- Composable 负责把连接绑定到页面/Feature 生命周期，并在卸载或退出 Feature 时完成订阅清理和连接关闭。
- Service 将原始消息转换为 Feature Type 或事件；Store / local reactive state 是 UI 可消费数据的唯一 Owner。原始 WebSocket 消息不得在 Component Tree 中传播。
- 只有多个 Feature 确实共享同一连接、协议和生命周期时，才将连接能力提升为 `shared/services/`；否则保持 Feature-private，避免一个全局连接承载无关业务。
- 连接失败、重连状态和不可恢复错误必须提供给所属 Feature 的状态或 Error Handling，不得 Silent Failure。
