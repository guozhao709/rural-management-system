# Nest 旧健康资料索引

> Document Role: LEGACY_NEST_REFERENCE  
> Status: SUPERSEDED

本目录仅用于 Nest 旧健康业务迁移、兼容和历史核对，不是当前业务 Source of Truth。当前健康 Requirement 见 [`../../../health/requirements.md`](../../../health/requirements.md)，统一路由见[业务模块索引](../../../index.md)。

## 历史资料

- [`api.md`](./api.md)：Nest 旧健康接口；
- [`context.md`](./context.md)：Nest 旧健康业务语境；
- [`backend-design/方案设计.md`](./backend-design/方案设计.md)：Nest 旧健康后端方案；
- [`backend-design/实施调整.md`](./backend-design/实施调整.md)：历史实施调整记录；
- [`backend-design/ASSUMPTIONS.md`](./backend-design/ASSUMPTIONS.md)：历史假设；
- [`backend-design/progress.md`](./backend-design/progress.md)：历史进度；
- [`backend-design/prompt.md`](./backend-design/prompt.md)：历史 Agent 提示词。

## 现存实现

现存 `nest_server/src/modules/resident-health/` 及对应 `nest_front` 健康功能属于冻结的 Nest 旧业务实现。除明确的替换、迁移任务，或经授权的安全、数据损坏、迁移阻塞修复外，不继续扩展。
