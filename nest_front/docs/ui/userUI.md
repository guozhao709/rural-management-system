# 智乡云用户端 UI 整体设计规范

## 1. 整体设计风格

用户端整体采用接近 HarmonyOS 的现代移动端视觉语言。

核心关键词：

**简洁、自然、柔和、圆润、轻盈、清晰、可信。**

整体避免传统 Web 页面和后台管理系统的视觉特征，不追求复杂装饰和强烈“科技感”，而是强调类似移动操作系统原生应用的自然体验。

同时考虑乡村居民及部分中老年用户，UI 应保持较高可读性和较低认知负担。

整体视觉原则：

> 蓝白基础色 + 柔和层级 + 大圆角 + 清晰文字层级 + 克制功能色 + 自然动效。

---

# 2. Color System

用户端采用以 **HarmonyOS 蓝白体系**为基础的颜色系统。

所有核心颜色必须通过全局 Design Token 定义，业务页面禁止自行创建相近颜色。

## 2.1 核心基础色

| Token                  | HEX       | 用途                  |
| ---------------------- | --------- | ------------------- |
| `Primary`              | `#0A59F7` | 品牌主色、主要按钮、选中状态、重要操作 |
| `Background Primary`   | `#FFFFFF` | 卡片、主要内容区域           |
| `Background Secondary` | `#F1F3F5` | 页面背景、次级容器背景         |
| `Background Tertiary`  | `#E5E5EA` | 更低层级背景、禁用区域         |
| `Text Primary`         | `#191919` | 一级标题、正文、重要信息        |
| `Text Secondary`       | `#666666` | 辅助说明、次级内容           |
| `Text Tertiary`        | `#999999` | 时间、提示等弱信息           |
| `Text On Primary`      | `#FFFFFF` | Primary 色背景上的文字     |
| `Divider`              | `#E5E5EA` | 分割线、极弱边界            |

其中 `#0A59F7`、`#FFFFFF`、`#F1F3F5`、`#E5E5EA` 与 HarmonyOS 官方 Light Theme 系统默认 Token 保持一致。HarmonyOS 官方同样将 `#0A59F7` 用作品牌色和高亮色。

---

## 2.2 状态颜色

状态色在整个用户端必须保持统一：

| 状态          | HEX       | 使用场景            |
| ----------- | --------- | --------------- |
| Success     | `#64BB5C` | 成功、正常、完成、健康状态正常 |
| Warning     | `#ED6F21` | 注意、提醒、中等风险      |
| Danger      | `#E84026` | 错误、危险、高风险、异常    |
| Information | `#0A59F7` | 普通提示、说明、信息状态    |

其中：

* `#64BB5C` 对应 HarmonyOS Light Theme 的 Confirm Color；
* `#ED6F21` 对应 Alert Color；
* `#E84026` 对应 Warning Color。

因此这些颜色优先作为整个项目统一的语义状态色。

---

## 2.3 智乡云业务辅助色

不同业务可以拥有独立辅助色，但这些颜色不改变整体 Design System。

| 业务 | 主辅助色      | 浅色背景      | 用途           |
| -- | --------- | --------- | ------------ |
| AI | `#0A59F7` | `#EAF1FF` | AI 助手、智能分析   |
| 农业 | `#52A85A` | `#EDF7EE` | 作物、农业知识、农事服务 |
| 健康 | `#26A77A` | `#EAF7F2` | 健康档案、健康分析    |
| 医疗 | `#3D7DF5` | `#EDF3FF` | 医院、医疗服务      |
| 天气 | `#46A0F5` | `#EDF7FF` | 天气、环境信息      |
| 村务 | `#7454D6` | `#F2EEFC` | 村委、政务、通知     |
| 活动 | `#F29B38` | `#FFF4E8` | 活动、娱乐、生活服务   |

以上属于 **智乡云项目自定义业务色**，不是 HarmonyOS 官方系统颜色。

业务色只能用于：

图标、Tag、局部强调、状态标识、浅色背景等小面积区域。

整个页面的大背景、主要卡片、主要文字和主要交互仍然使用统一基础色。

---

## 2.4 Primary Color 使用规则

`#0A59F7` 是整个用户端唯一 Primary Color。

主要应用于：

* Primary Button
* 当前 Tab
* 当前选项
* 可点击链接
* Switch 激活状态
* Radio / Checkbox 激活状态
* 重要图标
* Focus / Selected 状态

禁止不同页面自行出现：

`#1677FF`、`#409EFF`、`#1989FA`、`#317AF7`

等“差不多的蓝色”作为新的主色。

即使 Vant、Element Plus 或其他组件库存在自己的默认蓝色，也应该通过 Theme Token 统一覆盖为：

```css
--color-primary: #0A59F7;
```

---

## 2.5 页面颜色比例

页面整体应保持低色彩密度。

推荐视觉关系：

**白色 / 浅灰背景 > 深色文字 > Primary Blue > 业务辅助色。**

业务色和 Primary Color 都不应该大面积占据整个页面。

最终视觉应该首先让用户感受到：

**干净、明亮、自然。**

其次才感受到不同业务之间的颜色区分。

---

## 2.6 CSS Design Tokens

项目中应统一定义：

```css
:root {
  /* Brand */
  --color-primary: #0A59F7;

  /* Background */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F1F3F5;
  --color-bg-tertiary: #E5E5EA;

  /* Text */
  --color-text-primary: #191919;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-text-on-primary: #FFFFFF;

  /* Border */
  --color-divider: #E5E5EA;

  /* Semantic */
  --color-success: #64BB5C;
  --color-warning: #ED6F21;
  --color-danger: #E84026;
  --color-info: #0A59F7;

  /* Business */
  --color-ai: #0A59F7;

  --color-agriculture: #52A85A;
  --color-agriculture-soft: #EDF7EE;

  --color-health: #26A77A;
  --color-health-soft: #EAF7F2;

  --color-medical: #3D7DF5;
  --color-medical-soft: #EDF3FF;

  --color-weather: #46A0F5;
  --color-weather-soft: #EDF7FF;

  --color-village: #7454D6;
  --color-village-soft: #F2EEFC;

  --color-activity: #F29B38;
  --color-activity-soft: #FFF4E8;
}
```

开发过程中应优先引用 Design Token，而不是直接在业务组件中书写 HEX。

---

## 2.7 颜色系统原则

整个用户端遵循：

> **以 `#0A59F7` HarmonyOS Blue 为唯一 Primary Color，以 `#FFFFFF / #F1F3F5` 建立干净明亮的基础界面，以深灰文字建立信息层级，再使用农业绿、健康青绿、村务紫等有限业务色进行功能识别。**

任何新页面首先遵守全局颜色体系，再考虑业务自身的颜色表达。

# 3. Visual System

整体视觉以 HarmonyOS 风格的：

**纯净、圆润、空间层次感**

作为主要方向。

---

## 3.1 卡片

卡片采用：

* 白色或极浅色背景
* 大圆角
* 较宽松内边距
* 低对比阴影
* 尽量减少明显边框

避免传统 Web 常见的：

* 灰色粗边框
* 密集分割线
* 强阴影
* 小圆角矩形

---

## 3.2 圆角

全局采用统一的大圆角体系。

建议只保留几档：

* Small：8px
* Medium：12px
* Large：16px
* Extra Large：20–24px
* Pill：完全圆角

普通业务卡片优先使用 16px 左右圆角。

大型卡片、弹窗和浮层可使用 20–24px。

---

## 3.3 阴影

阴影必须保持柔和。

主要作用是表达：

**空间层级，而不是装饰。**

普通页面应尽量通过：

* 背景色
* 留白
* 卡片层级

区分内容。

只有浮层、悬浮控件、重要卡片等场景才明显使用阴影。

---

## 3.4 材质

允许适量使用：

* 半透明
* Blur
* 柔和渐变
* 轻微光感

但必须保持克制。

禁止大量使用：

* Glassmorphism
* Neumorphism
* Neon
* Cyberpunk
* 强发光
* 强渐变

---

# 4. Typography System

字体系统必须保持统一。

优先：

**HarmonyOS Sans SC**

无法使用时回退至：

**PingFang SC / Microsoft YaHei / 系统中文字体。**

---

## 4.1 字体层级

建议建立固定层级，而不是每个页面自行决定字号。

### Display / 特殊大标题

约：

**28–32px**

只用于少数非常重要的欢迎语、数字或核心信息。

---

### Page Title

约：

**24px**

用于页面一级标题。

字重：

**SemiBold / Bold**

---

### Section Title

约：

**20px**

用于主要内容区域标题。

字重：

**SemiBold**

---

### Card Title

约：

**17–18px**

字重：

**Medium / SemiBold**

---

### Body

约：

**16–17px**

作为主要正文。

这是用户端最常见的字号。

---

### Secondary Text

约：

**14–15px**

用于：

* 时间
* 辅助说明
* 次要信息

原则上避免大量使用 12px 或更小文字。

---

## 4.2 字重

不要通过大量颜色区分信息层级。

优先通过：

**字号 + 字重 + 间距**

建立信息层级。

推荐：

* 核心标题：Bold / SemiBold
* 普通标题：SemiBold
* 正文：Regular
* 次要信息：Regular

不建议大量使用极粗 Bold。

---

## 4.3 行间距

短标题：

约 **1.2–1.4**

普通正文：

约 **1.5–1.6**

长文章：

约 **1.6–1.8**

因为用户中可能存在年龄较大的用户，正文不能过于紧密。

---

# 5. Spacing System

整个项目必须采用统一间距体系。

推荐使用：

**4 / 8 / 12 / 16 / 24 / 32**

作为主要 spacing scale。

例如：

* 图标与文字：8px
* 同组内容：8–12px
* 卡片内部：16px
* 卡片之间：12–16px
* 不同主要模块：24px
* 大区域：32px

避免页面中随意出现大量：

13px、17px、19px、23px

等没有设计体系的数值。

总体原则：

> 信息之间保持足够呼吸感，不追求高密度。

---

# 6. Icon System

所有图标保持：

**简洁、现代、统一、易识别。**

优先使用统一的线性或 HarmonyOS Symbol 风格图标。

同一页面禁止混合大量不同风格：

* 线性图标
* 填充图标
* Emoji
* 彩色 PNG
* 卡通 Icon

Emoji 可以作为少量情绪表达或内容辅助，但不能承担整个系统的主要功能图标。

图标颜色默认跟随文字或 Primary Color，业务色只用于必要的功能识别。

---

# 7. Motion System

动画整体遵循：

**轻、快、自然。**

动画的目的主要是：

* 操作反馈
* 状态变化
* 空间关系表达

不是视觉炫技。

常规动画时间：

约 **150–300ms**。

常用：

* Fade
* Scale
* Translate
* 滑入滑出

点击元素可以提供轻微缩放反馈。

禁止大量：

* 弹跳
* 旋转
* 呼吸灯
* 大幅位移
* 长时间动画

用户关闭动画或系统开启 Reduced Motion 时，应尽量减少非必要动画。

---

# 8. Accessibility

用户端必须考虑较强的可读性和易操作性。

基本原则：

* 正文尽量不低于 16px
* 主要点击区域不小于约 44×44px
* 关键操作不能只依靠颜色表达
* 关键功能不能只显示图标而没有文字提示
* 正文和背景之间保持明显对比度
* 避免大量浅灰小字
* 避免连续出现大量专业术语

整体强调：

> 看得清、看得懂、点得到。

---

# 9. Consistency

一致性优先于单个页面的“好看”。

所有页面必须共享：

* Color System
* Typography
* Spacing
* Radius
* Shadow
* Icon Style
* Motion Style
* Interaction Feedback

不同页面可以拥有不同布局，但不能拥有完全不同的视觉语言。

例如：

农业页面可以使用绿色作为辅助色，

健康页面可以使用青绿色，

但：

背景、文字体系、圆角、卡片、间距、图标、按钮、动效等仍然属于同一个 Design System。

---

# 总体设计语言

智乡云用户端整体视觉语言定义为：

> **以 HarmonyOS 风格的纯净、自然、圆润和空间层次感作为视觉基础，以蓝白作为统一品牌基调，以克制的业务功能色进行场景区分，通过清晰的 Typography、宽松的 Spacing、大圆角和自然轻量的 Motion，形成现代、可信、易读且适合乡村居民使用的移动端视觉系统。**

具体页面的信息架构、业务布局、组件组合和数据展示方式，不在本规范中固定，由开发具体页面时根据业务需求单独设计，但不得突破上述 Design System。
