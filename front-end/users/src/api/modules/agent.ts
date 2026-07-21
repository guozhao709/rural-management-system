export interface AgentStreamHandlers {
  onContent: (content: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

interface AgentStreamPayload {
  content?: string;
  finished?: boolean;
  error?: string;
}

const AGENT_API_URL = "http://127.0.0.1:3000/api/agent";

const parseSseEvent = (eventText: string): AgentStreamPayload | null => {
  const dataLines = eventText
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));

  if (dataLines.length === 0) {
    return null;
  }

  try {
    return JSON.parse(dataLines.join("\n")) as AgentStreamPayload;
  } catch (error) {
    console.warn("Agent SSE 数据解析失败:", error);
    return null;
  }
};

export const requestAgentStream = async (
  message: string,
  handlers: AgentStreamHandlers,
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
    body: JSON.stringify({ message }),
    signal: handlers.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Agent 请求失败");
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      const finalText = decoder.decode();
      if (finalText) {
        buffer += finalText;
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventText of events) {
      const payload = parseSseEvent(eventText);

      if (!payload) {
        continue;
      }

      if (payload.content) {
        handlers.onContent(payload.content);
      }

      if (payload.error) {
        handlers.onError?.(payload.error);
        return;
      }

      if (payload.finished) {
        handlers.onDone?.();
        return;
      }
    }
  }

  if (buffer.trim()) {
    const payload = parseSseEvent(buffer);
    if (payload?.content) {
      handlers.onContent(payload.content);
    }
    if (payload?.error) {
      handlers.onError?.(payload.error);
      return;
    }
  }

  handlers.onDone?.();
};
