import express from "express";
import chatStream from "./tools/userAIchat.js";

const router = express.Router();

router.post("/mainAIchat", async (req, res) => {
  // 设置响应头，支持SSE流式传输
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 从请求体中获取用户ID和用户输入的文本
  const { userId, prompt } = req.body;
  console.log("此时传入的userid:", userId);
  console.log("此时传入的prompt:", prompt);
  

  // 调用聊天流函数
  await chatStream(userId, prompt, (content) => {
  // 发送SSE事件
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  });

  // 结束, 发送信息通知客户端对话结束
  res.write(`data: ${JSON.stringify({ finished: true })}\n\n`);
  res.end();
});

export default router;
