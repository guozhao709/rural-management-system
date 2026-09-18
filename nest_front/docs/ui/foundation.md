# 智乡云 UI 共享基础

本文件定义 User 与 Admin 共用的品牌和语义基础。页面实现必须优先引用全局 Design Token；不得在业务组件中直接创建相近 HEX 值。两端的页面背景、密度、圆角与组件细则分别见 [userUI.md](./userUI.md) 和 [adminUI.md](./adminUI.md)。

## 品牌与文字

| 项目 | 规范 |
| --- | --- |
| Primary | `#0A59F7`，唯一品牌主色，用于主要操作、选中、链接、激活与 Focus。 |
| 字体 | 优先 HarmonyOS Sans SC；回退 PingFang SC、Microsoft YaHei、系统中文字体。 |
| 图标 | 简洁、现代、统一的线性或 HarmonyOS Symbol 风格；同一页面不得混用多套风格。 |

两端共享品牌识别、状态色、业务辅助色、字体和基础图标风格，但不共享页面布局、密度、圆角、组件尺寸与交互模式。

## 共享基础 Token

| Token | 值 |
| --- | --- |
| `--color-primary` | `#0A59F7` |
| `--color-bg-primary` / `--color-bg-secondary` / `--color-bg-tertiary` | `#FFFFFF` / `#F1F3F5` / `#E5E5EA` |
| `--color-text-primary` / `--color-text-secondary` / `--color-text-tertiary` | `#191919` / `#666666` / `#999999` |
| `--color-text-on-primary` / `--color-divider` | `#FFFFFF` / `#E5E5EA` |
| `--color-success` / `--color-warning` / `--color-danger` / `--color-info` | `#64BB5C` / `#ED6F21` / `#E84026` / `#0A59F7` |

## 业务辅助色

| 业务 | Token | 主色 | 浅色背景 |
| --- | --- | --- | --- |
| AI | `--color-ai` | `#0A59F7` | `#EAF1FF` |
| 农业 | `--color-agriculture` / `--color-agriculture-soft` | `#52A85A` | `#EDF7EE` |
| 健康 | `--color-health` / `--color-health-soft` | `#26A77A` | `#EAF7F2` |
| 医疗 | `--color-medical` / `--color-medical-soft` | `#3D7DF5` | `#EDF3FF` |
| 天气 | `--color-weather` / `--color-weather-soft` | `#46A0F5` | `#EDF7FF` |
| 村务 | `--color-village` / `--color-village-soft` | `#7454D6` | `#F2EEFC` |
| 活动 | `--color-activity` / `--color-activity-soft` | `#F29B38` | `#FFF4E8` |

状态色和业务色是语义辅助，不应用于大面积背景、主要正文或替代 Primary。不得自行引入 `#1677FF`、`#409EFF`、`#1989FA`、`#317AF7` 等新的主蓝色。
