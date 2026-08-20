# Graph Report - nest_server  (2026-08-20)

## Corpus Check
- Corpus is ~17,566 words - fits in a single context window. You may not need a graph.

## Summary
- 692 nodes · 1320 edges · 54 communities (27 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- 通用校验与测试
- 认证模块与类型
- 认证接口控制器
- 项目配置与测试
- 健康检查与依赖注入
- 应用启动与公共基础
- 开发工具依赖
- 认证核心服务
- TypeScript 编译配置
- 农业分析知识链路
- 管理员接口控制器
- 测试编译配置
- 管理员模块结构
- ORM 配置与启动
- 管理员业务服务
- 构建编译配置
- 管理员创建校验
- 管理员查询校验
- ORM 注入测试替身
- 密码与日志依赖
- Nest CLI 配置
- 代码格式配置
- 认证字段迁移
- 角色权限守卫
- ORM 核心测试替身
- 构建清理脚本
- 账户基础迁移
- 校验器依赖
- Cookie 解析依赖
- 环境变量依赖
- 安全响应头依赖
- 环境配置校验
- LangChain 运行时
- LangChain 核心
- MikroORM 核心
- MikroORM 装饰器
- 数据库迁移框架
- Nest ORM 集成
- PostgreSQL 驱动
- Nest 通用框架
- Nest 配置模块
- Nest 核心框架
- JWT 认证依赖
- 结构化日志模块
- Express 平台适配
- Swagger 文档依赖
- HTTP 日志依赖
- 元数据反射依赖
- 响应式编程依赖
- 结构化输出校验

## God Nodes (most connected - your core abstractions)
1. `Admin` - 34 edges
2. `AuthService` - 31 edges
3. `User` - 31 edges
4. `AccountStatus` - 29 edges
5. `CreateUserDto` - 23 edges
6. `scripts` - 20 edges
7. `CreateAdminDto` - 20 edges
8. `UsersService` - 20 edges
9. `AdminRole` - 19 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)
- `AI 基础设施边界` --semantically_similar_to--> `M07 统一智能 Agent`  [INFERRED] [semantically similar]
  src/infrastructure/ai/README.md → docs/业务模块.md
- `main()` --indirect_call--> `Admin`  [INFERRED]
  scripts/seed-super-admin.ts → src/modules/admins/admin.entity.ts
- `Admin` --references--> `Entity`  [EXTRACTED]
  src/modules/admins/admin.entity.ts → test/mocks/mikro-orm-decorators.mock.ts
- `Admin` --references--> `Index`  [EXTRACTED]
  src/modules/admins/admin.entity.ts → test/mocks/mikro-orm-decorators.mock.ts
- `Admin` --references--> `PrimaryKey`  [EXTRACTED]
  src/modules/admins/admin.entity.ts → test/mocks/mikro-orm-decorators.mock.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **M08 作物分析生成与存储流程** — nest_server_docs____generate_agriculture_analysis_endpoint, nest_server_docs______independent_crop_analysis, nest_server_docs______kimi_moonshot, nest_server_docs______crop_analysis_store [EXTRACTED 1.00]
- **M08 Agent 农业检索流程** — nest_server_docs____unified_agent_endpoint, nest_server_docs____agriculture_service_search, nest_server_docs______agriculture_knowledge_store, nest_server_docs______crop_analysis_store [EXTRACTED 1.00]
- **未来 AI 业务模块基础设施** — nest_server_src_infrastructure_ai_readme_ai_infrastructure_boundary, nest_server_pnpm_workspace_langchain_dependency_set, nest_server_src_infrastructure_ai_readme_structured_output_runtime, nest_server_docs______m07_unified_intelligent_agent [INFERRED 0.85]

## Communities (54 total, 27 thin omitted)

### Community 0 - "通用校验与测试"
Cohesion: 0.05
Nodes (55): IsDateString, ResponseMessage(), AccountStatus, IsNotFutureDate(), CreateUserDto, ApiProperty, ApiPropertyOptional, IsEnum (+47 more)

### Community 1 - "认证模块与类型"
Cohesion: 0.08
Nodes (33): AdminSessionResult, UserSessionResult, AuthenticatedRequest, TokenType, CurrentAdmin, CurrentUser, AdminLoginDto, ApiProperty (+25 more)

### Community 2 - "认证接口控制器"
Cohesion: 0.08
Nodes (33): AdminAuthController, ApiBearerAuth, ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, Body (+25 more)

### Community 3 - "项目配置与测试"
Cohesion: 0.04
Nodes (47): description, engines, node, pnpm, jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions (+39 more)

### Community 4 - "健康检查与依赖注入"
Cohesion: 0.07
Nodes (25): Inject, HealthController, ApiOperation, ApiTags, Controller, Get, HealthModule, Module (+17 more)

### Community 5 - "应用启动与公共基础"
Cohesion: 0.06
Nodes (25): Catch, AppModule, Module, configureApplication(), AllExceptionsFilter, ResponseEnvelopeInterceptor, Injectable, LoggerModule (+17 more)

### Community 6 - "开发工具依赖"
Cohesion: 0.04
Nodes (45): eslint, eslint-config-prettier, @eslint/js, globals, jest, @mikro-orm/cli, @nestjs/cli, @nestjs/schematics (+37 more)

### Community 7 - "认证核心服务"
Cohesion: 0.12
Nodes (14): Admin, AuthService, Injectable, ActorType, IssuedTokenPair, JwtActorPayload, TokenService, Injectable (+6 more)

### Community 8 - "TypeScript 编译配置"
Cohesion: 0.07
Nodes (27): ES2024, compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+19 more)

### Community 9 - "农业分析知识链路"
Cohesion: 0.12
Nodes (25): PostgreSQL 18.4 服务, Agent 农业检索能力, agriculture_knowledge, crop_analysis, 独立作物分析能力, Kimi / Moonshot, M07 统一智能 Agent, M08 农业分析与农业知识 (+17 more)

### Community 10 - "管理员接口控制器"
Cohesion: 0.11
Nodes (19): AdminsController, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags (+11 more)

### Community 11 - "测试编译配置"
Cohesion: 0.12
Nodes (16): jest, node, test/**/*.ts, compilerOptions, declaration, isolatedModules, rootDir, sourceMap (+8 more)

### Community 12 - "管理员模块结构"
Cohesion: 0.37
Nodes (3): AdminRole, UpdateAdminDto, AdminListPresenter

### Community 13 - "ORM 配置与启动"
Cohesion: 0.15
Nodes (10): mikro-orm, configPaths, preferTs, tsLoader, ./dist/mikro-orm.config.js, ./src/mikro-orm.config.ts, main(), username (+2 more)

### Community 14 - "管理员业务服务"
Cohesion: 0.28
Nodes (5): AdminsService, Injectable, AdminPresenter, ApiProperty, ApiPropertyOptional

### Community 15 - "构建编译配置"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, incremental, outDir, rootDir, exclude, extends, include (+6 more)

### Community 16 - "管理员创建校验"
Cohesion: 0.15
Nodes (13): CreateAdminDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, Length (+5 more)

### Community 17 - "管理员查询校验"
Cohesion: 0.18
Nodes (11): QueryAdminDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength (+3 more)

### Community 18 - "ORM 注入测试替身"
Cohesion: 0.28
Nodes (5): entityName(), getRepositoryToken(), InjectRepository(), MikroOrmModule, Module

### Community 19 - "密码与日志依赖"
Cohesion: 0.29
Nodes (7): argon2, class-transformer, dependencies, argon2, class-transformer, pino, pino

### Community 20 - "Nest CLI 配置"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 21 - "代码格式配置"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 24 - "ORM 核心测试替身"
Cohesion: 0.50
Nodes (3): LockMode, QueryOrder, UniqueConstraintViolationException

## Ambiguous Edges - Review These
- `GET /api/v1/user/argiculture/info/:crop` → `argiculture 路径兼容决策`  [AMBIGUOUS]
  docs/接口.md · relation: conceptually_related_to
- `GET /api/v1/user/argiculture/info/db/:crop` → `argiculture 路径兼容决策`  [AMBIGUOUS]
  docs/接口.md · relation: conceptually_related_to

## Knowledge Gaps
- **161 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `semi`, `$schema` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `GET /api/v1/user/argiculture/info/:crop` and `argiculture 路径兼容决策`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `GET /api/v1/user/argiculture/info/db/:crop` and `argiculture 路径兼容决策`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `mikro-orm` connect `ORM 配置与启动` to `项目配置与测试`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Why does `main()` connect `ORM 配置与启动` to `认证核心服务`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Why does `Admin` connect `认证核心服务` to `通用校验与测试`, `认证模块与类型`, `认证接口控制器`, `管理员模块结构`, `ORM 配置与启动`, `管理员业务服务`, `ORM 注入测试替身`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Admin` (e.g. with `main()` and `.logoutAdmin()`) actually correct?**
  _`Admin` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `User` (e.g. with `.logoutUser()` and `.refreshUser()`) actually correct?**
  _`User` has 2 INFERRED edges - model-reasoned connections that need verification._