import { streamAgentReply } from "../services/agentService.js";

const writeSse = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const setSseHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
};

export const postChat = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    res.status(400).json({
      code: 400,
      message: "message 不能为空",
      data: null,
    });
    return;
  }

  setSseHeaders(res);

  try {
    await streamAgentReply({
      message,
      onToken: (content) => writeSse(res, { content }),
    });

    writeSse(res, { finished: true });
  } catch (error) {
    console.error("智乡云 Agent 流式回答失败:", error);
    writeSse(res, {
      error: "AI 服务暂时不可用，请稍后重试。",
    });
  } finally {
    res.end();
  }
};
