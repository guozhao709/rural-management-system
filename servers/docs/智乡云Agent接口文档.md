# 智乡云统一 Agent 文档

## 1. 功能介绍

智乡云统一 Agent 是面向前端聊天框的 AI 能力入口。前端只需要展示一个聊天框，把用户输入发送到统一接口，后端 Agent 会自动判断问题类型并选择处理方式。

当前 Agent 支持：

| 用户问题类型 | 后端优先调用 | 示例 |
| --- | --- | --- |
| 农业问题 | `agricultureTool` | 玉米叶子发黄怎么办 |
| 健康问题 | `healthTool` | 慢性荨麻疹怎么控制 |
| 天气问题 | `weatherTool` | 明天西安天气 |
| 普通聊天 | 模型直接回答 | 你好 |

后端实现要点：

- 使用 LangChain JS `createAgent`。
- 使用 OpenAI SDK 兼容接口，当前配置为 Moonshot/Kimi。
- 农业和健康工具会查询 SQLite 知识表，也会兼容查询现有分析表。
- 天气工具第一版使用本地模拟数据，后续可替换真实天气 API。
- 响应使用 SSE 流式返回，前端可以边接收边渲染。

## 2. 前端接入信息

### 基础路径

```txt
POST /api/agent
```

注意：统一 Agent 已与原有客服聊天接口区分开。Agent 使用 `/api/agent`，原有客服聊天接口继续使用 `/api/chat`，例如：

- `GET /api/chat/conversation`
- `GET /api/chat/messages`
- `POST /api/chat/messages`

统一 Agent 聊天入口是根路径：

```txt
POST /api/agent
```

### 鉴权方式

该接口经过用户鉴权中间件，前端必须携带登录 token。

```txt
Authorization: Bearer <userToken>
```

### 请求头

```txt
Content-Type: application/json
Authorization: Bearer <userToken>
```

### 请求体

```json
{
  "message": "玉米叶子发黄怎么办"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| message | string | 是 | 用户在聊天框输入的内容，不能为空字符串 |

## 3. SSE 响应格式

接口返回 `text/event-stream`，不是普通 JSON。

响应头：

```txt
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

### 文本片段事件

模型每生成一段文本，后端会返回一条 SSE 数据：

```txt
data: {"content":"玉米叶子发黄可能和缺氮、缺水、病害或根系问题有关"}

```

前端解析后，将 `content` 追加到当前 AI 消息气泡中。

### 完成事件

当本次回答结束时：

```txt
data: {"finished":true}

```

前端收到后应：

- 停止 loading 状态。
- 结束当前 AI 消息流。
- 允许用户继续发送下一条消息。

### 错误事件

如果后端 AI 服务或工具调用失败：

```txt
data: {"error":"AI 服务暂时不可用，请稍后重试。"}

```

前端收到后应：

- 停止 loading 状态。
- 展示错误提示。
- 不再等待后续流式内容。

## 4. 前端调用示例

浏览器原生 `EventSource` 不支持 POST body，因此推荐使用 `fetch` 读取 `ReadableStream`。

```js
async function sendAgentMessage(message, token, onContent, onDone, onError) {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventText of events) {
      const line = eventText
        .split("\n")
        .find((item) => item.startsWith("data: "));

      if (!line) {
        continue;
      }

      const payload = JSON.parse(line.slice(6));

      if (payload.content) {
        onContent(payload.content);
      }

      if (payload.finished) {
        onDone();
      }

      if (payload.error) {
        onError(payload.error);
      }
    }
  }
}
```

React 页面中的典型用法：

```js
await sendAgentMessage(
  inputValue,
  userToken,
  (chunk) => {
    setAiMessage((text) => text + chunk);
  },
  () => {
    setLoading(false);
  },
  (message) => {
    setLoading(false);
    setError(message);
  },
);
```

## 5. 请求示例

### 农业问题

请求：

```json
{
  "message": "玉米叶子发黄怎么办"
}
```

预期行为：

- Agent 优先调用农业工具。
- 工具查询农业知识库和历史作物分析。
- 前端收到连续 `content` 片段，最后收到 `finished: true`。

### 健康问题

请求：

```json
{
  "message": "慢性荨麻疹怎么控制"
}
```

预期行为：

- Agent 优先调用健康工具。
- 回答中会包含健康建议。
- 涉及疾病和症状时，后端提示不会替代医生诊断。

### 天气问题

请求：

```json
{
  "message": "明天西安天气"
}
```

预期行为：

- Agent 优先调用天气工具。
- 当前第一版返回本地模拟天气数据。

### 普通聊天

请求：

```json
{
  "message": "你好"
}
```

预期行为：

- Agent 可以不调用工具。
- 直接以智乡云 AI 助手身份回复。

## 6. 错误说明

### 400 参数错误

当 `message` 缺失或为空字符串时，后端返回普通 JSON，不返回 SSE。

```json
{
  "code": 400,
  "message": "message 不能为空",
  "data": null
}
```

### 401 未登录或 token 无效

当未传 token、token 格式错误或 token 过期时：

```json
{
  "code": 401,
  "message": "未登录或 token 无效",
  "data": null
}
```

### SSE 内部错误

请求已进入 SSE 流后，如果 AI 服务异常，返回：

```txt
data: {"error":"AI 服务暂时不可用，请稍后重试。"}

```

## 7. 前端状态建议

建议前端为一次 Agent 会话维护以下状态：

| 状态 | 类型 | 说明 |
| --- | --- | --- |
| inputValue | string | 输入框内容 |
| messages | array | 页面展示的聊天消息列表 |
| streamingMessage | string | 当前正在生成的 AI 回复 |
| loading | boolean | 是否正在等待 AI 回复 |
| error | string/null | 当前错误提示 |

发送流程建议：

1. 用户点击发送。
2. 校验输入非空。
3. 立即把用户消息追加到消息列表。
4. 创建一条空的 AI 消息，进入 loading。
5. 调用 `POST /api/agent`。
6. 每收到 `content` 就追加到 AI 消息。
7. 收到 `finished` 后关闭 loading。
8. 收到 `error` 后关闭 loading 并显示失败提示。

## 8. 联调注意事项

- 该接口是 SSE 流，不要用普通 `await response.json()` 解析成功响应。
- `POST /api/agent` 和 `POST /api/chat/messages` 是两个不同接口：
  - `POST /api/agent`：统一 AI Agent。
  - `POST /api/chat/messages`：原有用户与后台聊天消息。
- 当前 Agent 第一版不保存聊天历史，刷新页面后前端需要自己决定是否保留本地展示记录。
- 当前天气数据是模拟数据，不能作为真实天气服务承诺。
- 如果后端启动时报 `better-sqlite3` 原生绑定错误，需要先修复依赖构建环境。
