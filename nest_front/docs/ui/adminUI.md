# 智乡云管理员端 UI 规范

适用于管理员和运营人员使用的 PC 中后台页面。共享 Token 和基础原则见 [foundation.md](./foundation.md)。

## 设计目标

采用现代轻量化中后台语言：专业、简洁、清晰、稳定、高效、统一。默认以浅灰页面背景、白色内容容器、低对比边界和克制阴影组织信息。允许高于用户端的信息密度，但不得牺牲主次、可读性或操作效率。

推荐应用壳为 `Sidebar + Header + Main Content`；具体宽度和页面布局由业务设计决定。

## 管理端 Token 与尺度

| 项目 | 规则 |
| --- | --- |
| 页面 / 容器 / 次级表面 | `#F5F6F8` / `#FFFFFF` / `#F7F8FA`。Sidebar、Header 默认为白色。 |
| 边界 / Hover / Selected | `#E5E6EB` / `#F2F5FA` / `#EAF1FF`；边界默认 `1px`，不使用深灰粗线。 |
| 圆角 | `4 / 6 / 8 / 12px`；Card `8px`，Input/Button `6px`，Dialog `8–12px`。 |
| 阴影 | 普通 Card 弱或无阴影；推荐 `0 2px 8px rgba(0, 0, 0, .04)`，浮层可用 `0 6px 20px rgba(0, 0, 0, .08)`。 |
| 间距 | 使用 `4 / 8 / 12 / 16 / 24 / 32px`；页面 `20–24px`，Card `16–24px`，主要 Section `24px`。 |
| 标题 / 正文 | Page `20–24px`（推荐 `22px`），Section `18px`，Card `16px`，正文 `14–16px`（默认 `14px`）。 |
| 表格文字 | Header `14px Medium`，正文 `14px Regular`，辅助信息 `12–13px`，不小于 `12px`。 |
| 行高 | 标题 `1.3–1.4`，正文 `1.5`，表格 `1.4–1.5`，长文 `1.6`。 |
| 图标 | 线性、统一尺寸；常规 `16px`，Sidebar/重要操作 `18–20px`。 |

Primary Blue 只用于主要操作、链接、当前导航和选中状态；业务色仅用于 Tag、图标、数据分类、图表与少量状态区域。

## 组件与交互

| 场景 | 规则 |
| --- | --- |
| 操作层级 | 新增为 Primary；编辑为普通操作；查看为 Link/Secondary；删除为 Danger；批量操作置于 Toolbar。同一操作保持同一表达。 |
| 按钮 | Primary `#0A59F7/#FFFFFF`；Default 为白底、`#E5E6EB` 边、深色字；Secondary `#EAF1FF/#0A59F7`；Danger 使用 `#E84026`。每页原则上一个最主要 Primary Action。 |
| 表格 | 白底、`#F7F8FA` Header、低对比 Border、柔和 Hover、克制操作列；Row Hover `#F5F8FD`，Selected `#EAF1FF`。 |
| 表单 | 白底、`#E5E6EB` 边、`6px` 圆角；Label `14px/#191919`，Description `13px/#999999`，Error `#E84026`。 |
| 图表与 KPI | 首选 `#0A59F7`，再使用共享业务色；不得使用 ECharts 随机高饱和调色盘。一屏避免堆叠大量图表，KPI 应有主次。 |
| Hover / Focus | PC 交互必须有 Hover；Input/Select 等 Focus 使用 `#0A59F7` Border 或 Outline，且清晰可见。 |
| 动效 | `120–240ms`，用于展开、下拉、Dialog、Drawer、Tab 与 Hover；避免大幅弹跳、旋转、长渐变、背景动画和炫技 Loading。 |

## 响应式与可访问性

- Desktop 基准为 `1440px`，重点保证 `1280px / 1440px / 1920px`；宽屏扩展内容与表格区域，不拉伸文字和 Card。
- 窄屏优先 Sidebar 收起、表格横向滚动、Grid 降列，不强压所有内容。
- 正文原则上不低于 `14px`；状态不只依赖颜色；Icon Button 有 Tooltip；表单错误有文字；Hover 之外保留 Focus；点击区不可过小。

## 必须/禁止

- 必须优先考虑信息清晰、常用操作、层级、效率和已有组件复用，最后才处理装饰。
- 禁止传统深蓝 Sidebar + Header 默认组合、直接套用 Element Plus 默认主题、无限堆叠表格/图表/筛选/KPI、颜色滥用，以及霓虹、玻璃拟态、大面积渐变、复杂背景、3D 图标和强光效。
- 禁止使用 User 的超大圆角、宽松字号和低密度移动端组件模式。
