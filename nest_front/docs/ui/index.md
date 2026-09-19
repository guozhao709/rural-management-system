# 智乡云 UI 规范

本目录定义两个相互关联、但不可混用的 UI System：

| UI System | 受众与设备 | 规范 |
| --- | --- | --- |
| User | 普通用户、移动端 | [userUI.md](./userUI.md) |
| Admin | 管理员、PC 中后台 | [adminUI.md](./adminUI.md) |

两端共同遵循 [foundation.md](./foundation.md) 的品牌、语义色、业务色、字体和图标基础。

## 使用流程

1. 以实际使用者选择 User 或 Admin，不以路由、技术模块或组件库判断。
2. 阅读 `foundation.md` 与对应端规范；同时涉及两端时分别遵循。
3. 页面信息架构、布局和业务组件由当前 Requirement、Design、API 设计基线与适用的严格 API Contract 决定；本目录不固定页面布局。
4. 优先复用当前 SPA 已有组件和主题 Token。Vant、Element Plus 仅是组件基础，不得以其默认样式突破本规范。

## 开发检查

- 使用全局 Token，不在业务组件中创建相近颜色或无规律尺度。
- 保持对应端的密度、圆角、组件形式和交互方式；不得混用移动端与后台规则。
- 关键状态不能只依赖颜色；输入组件需有可见 Focus，错误需有文字。
- 页面变更的验证要求见 [`../validation/index.md`](../validation/index.md)。
