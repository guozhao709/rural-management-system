# 用户、管理员、认证与鉴权接口文档

本文档覆盖「智乡云 V2」当前已实现的用户、管理员、认证与鉴权接口，供前端登录、路由守卫和后台管理页面联调使用。

Swagger 页面：`/api/docs`。以下路径均以服务地址为前缀，例如本地环境为 `http://localhost:3000`。

## 通用约定

### 请求与响应

- 请求体使用 `application/json`。
- 除 `204 No Content` 外，所有成功和失败响应均使用统一结构。
- 全局参数校验已开启：未定义字段会返回 `400`，不会被静默忽略。

成功响应：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

失败响应：

```json
{
  "code": 401,
  "message": "认证未通过",
  "data": null
}
```

`DELETE` 和退出登录接口返回 `204 No Content`，响应体为空。

### Access Token 与 Refresh Token

登录、注册和刷新接口的 `data.accessToken` 是短期 Access Token，默认有效期为 `900` 秒。前端将其保存在运行时内存中，并在受保护接口的请求头中携带：

```http
Authorization: Bearer <accessToken>
```

Refresh Token 不会出现在 JSON 响应中，而是由服务端写入 `HttpOnly` Cookie。浏览器端无法通过 JavaScript 读取该 Cookie。

| 身份 | Refresh Token Cookie | Cookie Path |
| --- | --- | --- |
| 普通用户 | `zhixiangyun_user_refresh` | `/api/v2/auth/user` |
| 管理员 | `zhixiangyun_admin_refresh` | `/api/v2/auth/admin` |

Cookie 使用 `HttpOnly`、`SameSite=Lax`；生产环境同时启用 `Secure`。调用登录、刷新、退出接口时必须携带 Cookie：

```ts
// Axios
axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// fetch
fetch(url, { credentials: 'include' });
```

### 刷新与重试规则

1. 受保护接口返回 `401` 且当前仍有 Access Token 时，调用同一身份的刷新接口一次。
2. 刷新成功后，使用新 Access Token 重试原请求一次。
3. 刷新失败时，清除内存中的 Access Token 并跳转到对应登录页；不要继续重试。
4. 同一时间只发起一个刷新请求，其余失败请求等待该请求完成后再重试。

每次刷新都会轮换 Refresh Token。旧 Token 立即失效；并发使用同一个旧 Token 时，最多一个请求成功。一次新登录也会替换该账号原有的 Refresh Token。

用户和管理员的 Token、Cookie 与接口完全隔离，不能混用。Refresh Token 也不能作为业务接口的 Bearer Token 使用。

## 身份与权限

| 接口类别 | 普通用户 | `admin` | `super_admin` |
| --- | --- | --- | --- |
| 用户认证接口 | 本人 | 不适用 | 不适用 |
| 管理员认证接口 | 不适用 | 本人 | 本人 |
| 用户管理 `/api/v2/admin/users` | 无权限 | 可访问 | 可访问 |
| 管理员管理 `/api/v2/admin/admins` | 无权限 | 无权限 | 可访问 |

- `active` 账号可登录和访问受保护接口。
- `disabled` 账号登录或已登录后的受保护请求均返回 `403`。
- 已软删除账号无法登录或访问，通常返回 `401` 或资源不存在。
- 管理员角色以数据库当前值为准；角色调整后无需重新登录即可在下一次请求生效。

## 枚举与字段规则

| 字段 | 可选值或格式 |
| --- | --- |
| `status` | `active`、`disabled` |
| `gender` | `male`、`female`、`unknown` |
| `role` | `admin`、`super_admin` |
| `phone` | 6–20 位数字，可选前缀 `+`，例如 `13800000000` |
| `password` | 8–128 个字符；按原样处理，不会自动去除首尾空格 |
| `birthday` | `YYYY-MM-DD`，有效日期，且不能晚于当天 |
| `name` / `username` | 去除首尾空格后不能为空；最长 50 个字符 |
| `address` | 可为 `null`；非空时去除首尾空格后不能为空，最长 255 个字符 |

## 用户认证

### 注册并登录

```http
POST /api/v2/auth/user/register
```

无需认证。注册成功后会直接签发 Access Token，并设置用户 Refresh Token Cookie。自助注册不接受 `status` 字段，注册账号固定为 `active`。

请求体：

```json
{
  "phone": "13800000000",
  "password": "example-password",
  "name": "张三",
  "gender": "unknown",
  "birthday": "2000-01-01",
  "address": "西安市"
}
```

成功响应：`201 Created`

```json
{
  "code": 201,
  "message": "操作成功",
  "data": {
    "accessToken": "<JWT>",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "phone": "13800000000",
      "name": "张三",
      "gender": "unknown",
      "birthday": "2000-01-01",
      "address": "西安市",
      "status": "active"
    }
  }
}
```

手机号已存在时返回 `409`，消息为 `用户手机号已存在`。

### 登录

```http
POST /api/v2/auth/user/login
```

无需认证。成功后设置 `zhixiangyun_user_refresh` Cookie。

```json
{
  "phone": "13800000000",
  "password": "example-password"
}
```

成功响应为 `200 OK`，`data` 结构与注册接口一致。手机号不存在或密码不正确时返回 `401`，消息为 `手机号或密码错误`；已禁用账号返回 `403`，消息为 `账户已被禁用`。

### 刷新登录状态

```http
POST /api/v2/auth/user/refresh
```

无需请求体。浏览器自动携带 `zhixiangyun_user_refresh` Cookie。成功响应为 `200 OK`，`data` 结构与登录接口一致，同时服务端写入新的 Refresh Token Cookie。Cookie 缺失、已过期、已撤销或身份不匹配时返回 `401`，消息为 `Refresh Token 无效`。

### 退出登录

```http
POST /api/v2/auth/user/logout
```

无需请求体。服务端撤销当前用户 Refresh Token 并清除 Cookie，返回 `204 No Content`。该接口可重复调用。已签发的 Access Token 不会被立即撤销，最长仍可使用至其自然过期。

### 获取当前用户

```http
GET /api/v2/auth/user/me
Authorization: Bearer <userAccessToken>
```

成功响应：`200 OK`

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "phone": "13800000000",
    "name": "张三",
    "gender": "unknown",
    "birthday": "2000-01-01",
    "address": "西安市",
    "status": "active"
  }
}
```

管理员 Token 不能调用该接口。

## 管理员认证

当前没有管理员自助注册接口。初始超级管理员由后端初始化脚本创建；后续管理员由超级管理员通过管理员管理接口创建。

### 登录

```http
POST /api/v2/auth/admin/login
```

无需认证。成功后设置 `zhixiangyun_admin_refresh` Cookie。

```json
{
  "username": "admin01",
  "password": "example-password"
}
```

成功响应：`200 OK`

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "accessToken": "<JWT>",
    "expiresIn": 900,
    "admin": {
      "id": 1,
      "username": "admin01",
      "phone": "13800000000",
      "role": "admin",
      "status": "active"
    }
  }
}
```

用户名不存在或密码不正确时返回 `401`，消息为 `用户名或密码错误`；已禁用账号返回 `403`，消息为 `账户已被禁用`。

### 刷新登录状态

```http
POST /api/v2/auth/admin/refresh
```

无需请求体，依赖 `zhixiangyun_admin_refresh` Cookie。成功响应为 `200 OK`，`data` 结构与管理员登录接口一致，并轮换 Cookie 中的 Refresh Token。无效时返回 `401`，消息为 `Refresh Token 无效`。

### 退出登录

```http
POST /api/v2/auth/admin/logout
```

无需请求体，返回 `204 No Content`，并清除管理员 Refresh Token Cookie。

### 获取当前管理员

```http
GET /api/v2/auth/admin/me
Authorization: Bearer <adminAccessToken>
```

成功响应中的 `data` 为管理员对象，字段为 `id`、`username`、`phone`、`role`、`status`。普通用户 Token 不能调用该接口。

## 用户管理

统一前缀：`/api/v2/admin/users`。所有接口均要求管理员 Access Token，角色为 `admin` 或 `super_admin`。

### 创建用户

```http
POST /api/v2/admin/users
Authorization: Bearer <adminAccessToken>
```

请求体与用户注册接口相同，但允许额外传入 `status`：

```json
{
  "phone": "13900000000",
  "password": "example-password",
  "name": "李四",
  "gender": "female",
  "birthday": null,
  "address": null,
  "status": "active"
}
```

成功响应：`201 Created`，`message` 为 `用户创建成功`。`data` 为用户详情，字段如下：

```json
{
  "id": 2,
  "phone": "13900000000",
  "name": "李四",
  "gender": "female",
  "birthday": null,
  "address": null,
  "status": "active",
  "createdAt": "2026-08-26T00:00:00.000Z",
  "updatedAt": "2026-08-26T00:00:00.000Z"
}
```

### 查询用户列表

```http
GET /api/v2/admin/users?page=1&pageSize=15&keyword=张&gender=male&status=active
Authorization: Bearer <adminAccessToken>
```

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 页码，默认 `1`，最小 `1` |
| `pageSize` | 否 | 每页数量，默认 `15`，范围 `1`–`100` |
| `keyword` | 否 | 按姓名或手机号模糊搜索，最长 50 个字符 |
| `gender` | 否 | `male`、`female`、`unknown` |
| `status` | 否 | `active`、`disabled` |

结果按创建时间倒序返回：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "pageSize": 15
  }
}
```

### 查询用户详情

```http
GET /api/v2/admin/users/:id
Authorization: Bearer <adminAccessToken>
```

`:id` 必须为正整数。成功时返回上一节所示的用户详情对象；不存在或已删除时返回 `404`，消息为 `用户不存在`。

### 更新用户

```http
PATCH /api/v2/admin/users/:id
Authorization: Bearer <adminAccessToken>
```

请求体可提交创建用户接口中的任意字段；至少提供一个可修改字段。希望清空生日或地址时传 `null`：

```json
{
  "name": "李四（已更新）",
  "birthday": null,
  "address": null,
  "status": "disabled"
}
```

成功响应：`200 OK`，`message` 为 `用户更新成功`。空对象会返回 `400`，消息为 `至少提供一个可修改字段`。更新后若状态变为 `disabled`，该用户当前及后续受保护请求会被拒绝。

### 删除用户

```http
DELETE /api/v2/admin/users/:id
Authorization: Bearer <adminAccessToken>
```

执行软删除，返回 `204 No Content`。该用户不会再出现在列表中，也不能继续登录。

## 管理员管理

统一前缀：`/api/v2/admin/admins`。所有接口均要求 `super_admin` Access Token；普通 `admin` 调用时返回 `403`。

### 创建管理员

```http
POST /api/v2/admin/admins
Authorization: Bearer <superAdminAccessToken>
```

```json
{
  "username": "operator01",
  "password": "example-password",
  "phone": "13700000000",
  "role": "admin",
  "status": "active"
}
```

`phone` 可传 `null`；`role` 和 `status` 不传时分别默认为 `admin` 和 `active`。成功响应：`201 Created`，`message` 为 `管理员创建成功`，`data` 为管理员详情：

```json
{
  "id": 3,
  "username": "operator01",
  "phone": "13700000000",
  "role": "admin",
  "status": "active",
  "createdAt": "2026-08-26T00:00:00.000Z",
  "updatedAt": "2026-08-26T00:00:00.000Z"
}
```

### 查询管理员列表

```http
GET /api/v2/admin/admins?page=1&pageSize=15&keyword=operator&role=admin&status=active
Authorization: Bearer <superAdminAccessToken>
```

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 页码，默认 `1`，最小 `1` |
| `pageSize` | 否 | 每页数量，默认 `15`，范围 `1`–`100` |
| `keyword` | 否 | 按用户名或手机号模糊搜索，最长 50 个字符 |
| `role` | 否 | `admin`、`super_admin` |
| `status` | 否 | `active`、`disabled` |

成功响应的 `data` 结构为：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "pageSize": 15
}
```

外层仍包含通用的 `code`、`message` 和 `data`。

### 查询管理员详情

```http
GET /api/v2/admin/admins/:id
Authorization: Bearer <superAdminAccessToken>
```

`:id` 必须为正整数。成功时返回创建管理员接口所示的管理员详情对象；不存在或已删除时返回 `404`，消息为 `管理员不存在`。

### 更新管理员

```http
PATCH /api/v2/admin/admins/:id
Authorization: Bearer <superAdminAccessToken>
```

请求体可提交创建管理员接口中的任意字段，至少提供一个字段：

```json
{
  "phone": null,
  "role": "super_admin",
  "status": "active"
}
```

成功响应：`200 OK`，`message` 为 `管理员更新成功`。空对象返回 `400`，消息为 `至少提供一个可修改字段`。管理员被禁用后无法登录或继续访问受保护接口。

### 删除管理员

```http
DELETE /api/v2/admin/admins/:id
Authorization: Bearer <superAdminAccessToken>
```

执行软删除并返回 `204 No Content`。已删除管理员不能再登录。

## 常见状态码

| 状态码 | 含义 | 前端处理建议 |
| --- | --- | --- |
| `200` | 查询、登录、刷新或更新成功 | 读取 `data` |
| `201` | 创建或注册成功 | 读取 `data`；注册后保存 Access Token |
| `204` | 删除或退出登录完成 | 不解析响应体 |
| `400` | 参数校验未通过 | 展示或映射 `message`；检查未知字段、日期和分页参数 |
| `401` | 缺少、无效或过期的认证信息 | 按刷新规则尝试一次；刷新失败则回到登录页 |
| `403` | 当前账号已禁用或角色权限不足 | 显示无权限或账号不可用提示，不自动刷新重试 |
| `404` | 目标用户或管理员不存在 | 刷新列表或返回上一页 |
| `409` | 唯一字段重复 | 根据 `message` 标记重复的手机号或用户名 |
| `500` | 服务端异常 | 显示通用错误并保留请求上下文以便排查 |

## 前端接入检查清单

- 登录成功后仅保存 `accessToken`、账号基本资料和角色；不要尝试保存 Refresh Token。
- 普通用户使用 `/api/v2/auth/user/*`，管理员使用 `/api/v2/auth/admin/*`，不要共享刷新地址。
- 受保护接口统一注入 `Authorization: Bearer <accessToken>`。
- 所有 Cookie 相关请求启用 `withCredentials` 或 `credentials: 'include'`。
- 使用单例刷新任务避免并发刷新导致旧 Refresh Token 被拒绝。
- 收到 `403` 时按禁用或权限不足处理；收到 `401` 后最多执行一次刷新与重试。
- 管理后台的菜单和路由可根据 `/api/v2/auth/admin/me` 返回的 `role` 控制；服务端仍会进行最终权限校验。
