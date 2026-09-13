# Legacy Module Documentation Policy

本目录只保存历史业务资料，不是当前业务 Source of Truth。

## Default Access

Agent 默认不得读取本目录内容。只有当前 Requirement 明确涉及以下范围时才可按需读取：

- Nest 旧业务迁移或兼容；
- Express 旧业务迁移或兼容；
- 旧数据、旧接口或旧实现的历史核对；
- 用户明确指定的 legacy 文件。

## Provenance

- `nest/`：Nest 旧业务资料及待替换实现的历史设计、Contract 和实施记录；
- `express/`：Express 旧业务资料，仅在存在实际材料时创建对应目录。

不得使用无来源限定的“旧业务”。引用时必须明确写为“Nest 旧业务”或“Express 旧业务”。

## Authority

- 本目录文件不得覆盖 `docs/module/<domain>/requirements.md`；
- 本目录中的旧 API 不得作为当前 Contract；
- Existing Legacy Implementation 只能作为迁移 Evidence；
- 历史文档和不可变 Migration 可保留旧业务编号，当前路径、Contract 和新增代码不得继续使用该编号体系。
