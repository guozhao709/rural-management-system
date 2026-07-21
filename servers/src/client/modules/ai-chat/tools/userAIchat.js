import openAI from "openai";

// 用户AI聊天工具, 要实现的是流式传输
// 1. 首先建立一个映射, 通过用户id来区分不同用户的聊天记录, 因为要实现多轮对话
// 2. 所以, 用户要给路由发送自己的Id, 并且路由要传这个id给stream函数
// 3. 要考虑存储, 用map映射, 一个id一个对话记录
// 4. 存储就临时存储在内存中, 就先不写入数据库了, 这个实现完成再看效果

const kimiKey = process.env.KIMI_API_KEY;

if (!kimiKey) {
  throw new Error("Missing KIMI_API_KEY. Please set KIMI_API_KEY in the root .env file.");
}

const chatMap = new Map();

const client = new openAI({
  apiKey: kimiKey,
  baseURL: "https://api.moonshot.cn/v1",
});

// 传入三个参数, 用户id, 用户输入的文本, 回调函数, 回调函数接收模型返回的文本
const chatStream = async (userId, prompt, callback) => {

  // 当前传入的id
  console.log("当前的Id", userId);
  
  // 先判断用户id是否存在
  if (!chatMap.has(userId)) {
    chatMap.set(userId, [
      {
        role: "system",
        content:
          "你是一个专业的AI助手, 你的任务是回答用户的问题, 并提供相关的帮助。",
      },
    ]);
  }
  // 将用户输入的文本添加到对话记录中
  const messageQueue = chatMap.get(userId);
  messageQueue.push({ role: "user", content: prompt });

  console.log("目前的消息队列:",messageQueue);

  // 当上下文超过10轮对话时, 移除最早的两轮对话, 但保留system角色
  if (messageQueue.length >= 21) {
    messageQueue.splice(1, 2);
  }

  // 创建流
  const stream = await client.chat.completions.create({
    model: "moonshot-v1-8k",
    messages: messageQueue,
    temperature: 1,
    stream: true, // 开启流式响应
    stream_options: {
      include_usage: true, // 可选：返回token使用量
    },
  });

  // 5. 监听流式数据
  let fullReply = ""; // 拼接完整回复（用于存入上下文）
  for await (const chunk of stream) {
    // 提取当前分块的内容
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullReply += content;
      // 逐块返回数据（SSE格式：data: 内容\n\n）
      callback(content);
    }
  }
  // 6. 将模型返回的文本添加到对话记录中
  chatMap.get(userId).push({ role: "assistant", content: fullReply });
};

export default chatStream;
