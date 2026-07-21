# rural-management-system

这是一个将三个独立项目合并后的 pnpm workspace：

- `front-end/admin`：后台管理端，Vue + Vite
- `front-end/users`：用户端，Vue + Vite
- `servers`：后端服务，Node.js + Express

## 目录结构

```text
.
├─ front-end/
│  ├─ admin/
│  └─ users/
└─ servers/
```

## 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm

## 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

## 启动方式

根目录脚本：

- `pnpm dev`：同时启动三个项目
- `pnpm dev:admin`：仅启动后台管理端
- `pnpm dev:users`：仅启动用户端
- `pnpm dev:server`：仅启动后端服务

构建脚本：

- `pnpm build`：按 workspace 顺序构建所有项目
- `pnpm build:admin`：构建后台管理端
- `pnpm build:users`：构建用户端
- `pnpm build:server`：构建后端服务

## 配置说明

- 后端环境变量放在 `servers/.env`
- 前端如果需要环境变量，分别放在各自项目目录下的 `.env*` 文件中
- 本地生成物如 `node_modules`、`dist`、`.pnpm-store` 不需要提交