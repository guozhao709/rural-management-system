# 智乡云管理员端 UI 整体设计规范

## 1. 整体设计风格

智乡云管理员端定位为：

**面向 PC 的现代中后台管理系统。**

整体采用常见企业级中后台设计语言，但继续继承用户端的品牌特征，使两端在视觉上属于同一套产品体系。

核心关键词：

**专业、简洁、清晰、稳定、高效、统一。**

管理员端允许比用户端拥有更高的信息密度，但应避免：

* 传统政务系统式的厚重设计
* 大面积深蓝背景
* 复杂渐变
* 强阴影
* 过度装饰
* 过于密集的表格和表单

整体视觉原则：

> **蓝白基础色 + 浅灰后台背景 + 白色内容容器 + 清晰信息层级 + 适度圆角 + 克制阴影 + 高效中后台交互。**

---

# 2. Color System

管理员端与用户端共享品牌 Primary Color：

```text
#0A59F7
```

不得重新定义另一套蓝色作为后台主色。

---

## 2.1 核心基础色

| Token                 | HEX       | 用途                      |
| --------------------- | --------- | ----------------------- |
| `Primary`             | `#0A59F7` | 品牌、主要操作、选中状态            |
| `Page Background`     | `#F5F6F8` | 后台页面整体背景                |
| `Surface`             | `#FFFFFF` | Card、Table、Form 等主要内容容器 |
| `Surface Secondary`   | `#F7F8FA` | 次级区域、Table Header 等     |
| `Sidebar Background`  | `#FFFFFF` | 左侧导航栏                   |
| `Header Background`   | `#FFFFFF` | 顶部导航                    |
| `Text Primary`        | `#191919` | 标题、正文、重要信息              |
| `Text Secondary`      | `#666666` | 辅助信息                    |
| `Text Tertiary`       | `#999999` | 弱提示、时间等                 |
| `Border`              | `#E5E6EB` | Border、Divider、Table    |
| `Hover Background`    | `#F2F5FA` | Hover 状态                |
| `Selected Background` | `#EAF1FF` | Menu、Row 等选中状态          |

管理员端整体颜色应比用户端更加中性。

---

## 2.2 状态颜色

与用户端保持统一：

| 状态          | HEX       | 用途          |
| ----------- | --------- | ----------- |
| Success     | `#64BB5C` | 成功、启用、正常    |
| Warning     | `#ED6F21` | 警告、注意       |
| Danger      | `#E84026` | 删除、错误、禁用、危险 |
| Information | `#0A59F7` | 普通信息        |

禁止管理员端自行引入另一套：

```text
绿色 / 黄色 / 红色
```

作为状态体系。

---

## 2.3 业务辅助色

业务色原则上继续沿用用户端：

| 业务 | HEX       |
| -- | --------- |
| AI | `#0A59F7` |
| 农业 | `#52A85A` |
| 健康 | `#26A77A` |
| 医疗 | `#3D7DF5` |
| 天气 | `#46A0F5` |
| 村务 | `#7454D6` |
| 活动 | `#F29B38` |

管理员端使用业务色时更加克制。

主要用于：

* Tag
* 图标
* 数据分类
* 图表
* 少量状态区域

不应用业务色改变整个后台模块的视觉风格。

---

# 3. Visual System

管理员端采用典型的：

**Sidebar + Header + Main Content**

中后台视觉结构。

但具体 Sidebar 宽度、页面布局和业务内容不在当前规范中固定。

整体视觉要求：

**平整、轻量、清晰。**

---

## 3.1 内容容器

主要内容区域使用：

```text
#FFFFFF
```

作为 Surface。

背景使用：

```text
#F5F6F8
```

形成轻微层级。

Card 不应通过强阴影突出，而主要通过：

* 背景色差异
* 留白
* Border
* 极轻阴影

建立层级。

---

## 3.2 圆角

管理员端圆角应小于用户端，但仍然保持一定的现代感。

建议：

* Small：`4px`
* Medium：`6px`
* Large：`8px`
* Extra Large：`12px`

主要使用：

```text
6px / 8px
```

Card：

```text
8px
```

Input / Button：

```text
6px
```

Dialog：

```text
8px–12px
```

禁止大量使用用户端的：

```text
20px / 24px
```

超大圆角。

管理员端应更加理性和紧凑。

---

## 3.3 Border

管理员端可以比用户端更多使用 Border。

统一：

```text
#E5E6EB
```

主要用于：

* Table
* Form
* Input
* Divider
* Card 边界
* Dropdown

Border 默认保持：

```text
1px
```

避免使用深灰色粗边框。

---

## 3.4 阴影

普通 Card 原则上：

**弱阴影或无阴影。**

推荐：

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
```

Dropdown、Popover、Dialog 等悬浮组件可以适当增强：

```css
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
```

禁止厚重阴影。

---

# 4. Typography System

管理员端字体仍然与用户端保持统一。

优先：

**HarmonyOS Sans SC**

回退：

**PingFang SC / Microsoft YaHei / 系统中文字体。**

相比用户端，管理员端字号更加紧凑。

---

## 4.1 字体层级

### Page Title

```text
20–24px
```

推荐：

```text
22px
```

字重：

**SemiBold**

---

### Section Title

```text
18px
```

字重：

**SemiBold**

---

### Card Title

```text
16px
```

字重：

**Medium / SemiBold**

---

### Body

```text
14–16px
```

推荐默认正文：

```text
14px
```

重要正文：

```text
16px
```

---

### Table

Table Header：

```text
14px
Medium
```

Table Body：

```text
14px
Regular
```

辅助信息：

```text
12–13px
```

原则上不得小于：

```text
12px
```

---

## 4.2 字体颜色

统一：

```text
一级文字：#191919
二级文字：#666666
三级文字：#999999
```

管理员端避免大面积使用蓝色文字。

Primary Blue 主要用于：

* 可点击操作
* 当前导航
* 链接
* 选中状态

---

## 4.3 字重

推荐：

* Page Title：SemiBold
* Section Title：SemiBold
* Table Header：Medium
* Card Title：Medium
* Body：Regular
* Secondary：Regular

信息层级主要通过：

**字号 + 字重 + 间距 + 颜色**

共同建立。

---

## 4.4 行间距

标题：

```text
1.3–1.4
```

普通正文：

```text
1.5
```

Table：

```text
1.4–1.5
```

长文本：

```text
1.6
```

---

# 5. Spacing System

管理员端继续采用统一 Spacing Scale：

```text
4 / 8 / 12 / 16 / 24 / 32
```

相比用户端可以更加紧凑。

推荐：

图标与文字：

```text
8px
```

Form Label 与 Input：

```text
8px
```

同组内容：

```text
8–12px
```

Card 内部：

```text
16–24px
```

Card 之间：

```text
16px
```

主要 Section：

```text
24px
```

页面 Padding：

```text
20–24px
```

禁止随意使用大量无规律间距。

---

# 6. Icon System

管理员端与用户端尽量使用同一套基础 Icon System。

图标整体风格：

**简洁线性、统一尺寸、低装饰性。**

推荐优先：

* Element Plus Icons
* 统一 SVG Icon
* HarmonyOS Symbol 风格图标

禁止大量混用：

* Emoji
* 彩色 PNG
* 3D Icon
* 卡通 Icon
* 多套不同图标库

管理员端原则上不使用 Emoji 作为正式功能图标。

---

## 6.1 图标尺寸

常规：

```text
16px
```

Sidebar：

```text
18–20px
```

重要操作：

```text
18–20px
```

空状态等视觉辅助场景可以适当放大。

---

# 7. Data Visualization

管理员端可能大量出现：

* KPI
* Chart
* Table
* Statistics

因此需要保持统一的数据视觉语言。

---

## 7.1 图表颜色

Chart 的第一主色优先：

```text
#0A59F7
```

其他颜色优先从业务辅助色中选择：

```text
#52A85A
#26A77A
#3D7DF5
#46A0F5
#7454D6
#F29B38
```

禁止 ECharts 自动生成大量随机高饱和颜色。

---

## 7.2 数据表达

管理员端虽然允许较高信息密度，但仍要确保：

**重要信息优先于数据数量。**

避免：

* 一屏十几个 Chart
* KPI 数字无主次
* 大量相似颜色
* 所有数据全部高亮

关键 KPI 可以使用：

```text
大数字 + 简短说明 + 状态变化
```

次要数据保持普通文字即可。

---

# 8. Interaction System

管理员端强调：

**高效、明确、可预测。**

同一种操作在不同页面必须采用相同交互。

例如：

* 新增 → Primary Button
* 编辑 → 普通操作
* 查看 → Link / Secondary Action
* 删除 → Danger Action
* 批量操作 → Toolbar

禁止同一个动作在不同页面出现完全不同的视觉形式。

---

## 8.1 Hover

PC 端必须提供明确 Hover Feedback。

例如：

Navigation：

```text
#F2F5FA
```

Selected：

```text
#EAF1FF
```

文字 / Icon：

```text
#0A59F7
```

---

## 8.2 Focus

Input、Select 等输入组件获得 Focus 时：

Border 或 Outline 使用：

```text
#0A59F7
```

Focus 状态必须清晰可见。

---

# 9. Motion System

管理员端 Motion 比用户端更加克制。

常规动画时间：

```text
120–240ms
```

常见动画：

* Fade
* Dropdown
* Collapse
* Slide
* 微弱 Scale

动画主要用于：

* Sidebar 展开
* Dropdown
* Dialog
* Drawer
* Tab 切换
* Hover Feedback

禁止：

* 大幅弹跳
* 旋转
* 长时间渐变
* 大面积背景动画
* 炫技型 Loading

后台操作强调效率。

---

# 10. Table Visual Style

Table 是管理员端的重要视觉元素。

统一原则：

* 白色背景
* Header 使用极浅灰背景
* Header 字体稍重
* Row 高度适中
* Border 保持低对比
* Hover 状态明显但柔和
* 操作列保持克制

推荐 Table Header：

```text
Background: #F7F8FA
Text: #666666
```

Row Hover：

```text
#F5F8FD
```

Selected Row：

```text
#EAF1FF
```

Table 不应采用传统系统中明显的深灰 Grid。

---

# 11. Form Visual Style

Form 保持：

**清晰、紧凑、有规律。**

Input / Select 等组件：

* 白色背景
* `#E5E6EB` Border
* `6px` Radius
* 清晰 Focus 状态

Label：

```text
14px
#191919
```

Description：

```text
13px
#999999
```

Error：

```text
#E84026
```

表单项之间必须保持统一间距。

---

# 12. Button System

按钮保持中后台标准视觉。

### Primary

```text
Background: #0A59F7
Text: #FFFFFF
```

### Default

```text
Background: #FFFFFF
Border: #E5E6EB
Text: #191919
```

### Secondary

```text
Background: #EAF1FF
Text: #0A59F7
```

### Danger

```text
Background / Text: #E84026
```

删除等危险操作必须通过明确的危险色表达。

页面内原则上只存在一个最主要 Primary Action。

---

# 13. Accessibility

虽然管理员用户主要为 PC 使用者，也必须保持基本可访问性。

要求：

* 正文原则上不低于 14px
* 文字与背景保持足够对比度
* Hover 之外必须同时存在 Focus 状态
* 状态不能只依靠颜色区分
* Icon Button 必须具备 Tooltip
* 表单错误必须同时显示文字
* 点击区域不能过小

不得为了提高后台信息密度而牺牲基本可读性。

---

# 14. Responsive

管理员端以 Desktop 为主要目标。

推荐设计基准：

```text
1440px
```

重点适配：

```text
1280px
1440px
1920px
```

最低应保证常见 PC 分辨率下可以正常使用。

页面宽度增加时应：

* 增加内容展示空间
* 合理扩大表格区域
* 允许更多 Columns

而不是无限拉伸文字和 Card。

对于较窄屏幕，应优先：

* Sidebar Collapse
* Table 横向滚动
* Grid 降列

而不是强行压缩所有内容。

---

# 15. Consistency

管理员端内部一致性优先于单个页面的个性化。

所有模块必须共享：

* Color System
* Typography
* Radius
* Spacing
* Border
* Shadow
* Icon Style
* Button Style
* Table Style
* Form Style
* Motion Style

不同业务模块只允许在：

**业务辅助色、Icon 和具体内容**

方面存在差异。

---

# 16. 用户端与管理员端的视觉关系

用户端和管理员端属于同一个智乡云产品，因此必须存在明显的品牌连续性。

双方共享：

```text
Primary Blue：#0A59F7
字体系统
状态色
业务辅助色
Icon 风格
基础视觉语言
```

但两者侧重点不同：

### 用户端

更强调：

**柔和、圆润、友好、大字号、低信息密度。**

### 管理员端

更强调：

**专业、紧凑、高效、清晰、高信息密度。**

因此管理员端：

* 圆角更小
* 字号稍小
* Border 使用更多
* 信息密度更高
* Motion 更克制
* Table / Form 更突出

但不能变成完全不同的视觉体系。

---

# 17. 禁止事项

管理员端禁止：

### 禁止 1：传统深蓝后台

禁止：

```text
深蓝 Sidebar
+
深蓝 Header
+
白色 Main
```

这种非常传统的后台视觉成为默认设计。

优先保持浅色、轻量体系。

---

### 禁止 2：完全复制 Element Plus 默认样式

Element Plus 只是组件基础。

必须通过 Theme Token 统一：

* Primary Color
* Radius
* Typography
* Spacing
* Table
* Form

使其符合智乡云 Design System。

---

### 禁止 3：过高信息密度

不要因为是后台就无限堆叠：

* Table
* Chart
* Button
* Filter
* KPI

信息仍然必须存在明显主次。

---

### 禁止 4：颜色滥用

禁止每一个状态、模块、卡片都使用不同颜色。

大多数后台内容应保持：

```text
白 + 灰 + 黑 + Primary Blue
```

业务色只是辅助。

---

### 禁止 5：复杂装饰

禁止：

* 霓虹
* 玻璃拟态
* 大面积渐变
* 复杂背景
* 3D 图标
* 强光效

管理员端优先保证工作效率。

---

# 18. Agent 设计原则

Agent 在设计管理员端页面时，首先考虑：

```text
信息是否清晰
↓
管理员最常用的操作是什么
↓
信息层级是否合理
↓
操作是否高效
↓
是否复用了已有组件
↓
最后再考虑视觉装饰
```

任何页面不得为了“看起来高级”而降低操作效率。

---

# 19. 总体设计语言

智乡云管理员端整体视觉语言定义为：

> **采用现代轻量化 PC 中后台设计语言，以 `#0A59F7` 作为统一品牌主色，以浅灰页面背景和白色内容容器建立清晰的信息层级，通过适度圆角、低对比 Border、克制阴影、规范 Typography 和高效的数据展示方式构建专业、稳定、清晰的后台管理体验，同时延续智乡云用户端的品牌色、字体、图标和业务色体系，使管理员端与用户端在视觉上保持统一而不过度相似。**
