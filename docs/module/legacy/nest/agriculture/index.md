# Nest 旧农业资料索引

> Document Role: LEGACY_NEST_REFERENCE  
> Status: SUPERSEDED

本目录仅用于 Nest 旧农业业务迁移、兼容和历史核对，不是当前业务 Source of Truth。当前农业 Requirement 见 [`../../../agriculture/requirements.md`](../../../agriculture/requirements.md)，统一路由见[业务模块索引](../../../index.md)。

## 历史资料

- [`api.md`](./api.md)：Nest 旧农业接口；
- [`backend-design/方案设计.md`](./backend-design/方案设计.md)：Nest 旧农业后端方案；
- [`backend-design/农业知识种子来源与摘要.md`](./backend-design/农业知识种子来源与摘要.md)：历史知识种子说明；
- [`backend-design/实施调整.md`](./backend-design/实施调整.md)：历史实施调整记录。

## 现存实现

现存 `nest_server/src/modules/agriculture/` 及对应 `nest_front` 农业功能属于冻结的 Nest 旧业务实现。除明确的替换、迁移任务，或经授权的安全、数据损坏、迁移阻塞修复外，不继续扩展。
