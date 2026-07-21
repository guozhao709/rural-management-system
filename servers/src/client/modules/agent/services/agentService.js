let agentPromise;

const kimiKey = process.env.KIMI_API_KEY;

if (!kimiKey) {
  throw new Error("Missing KIMI_API_KEY. Please set KIMI_API_KEY in the root .env file.");
}

const extractText = (message) => {
  const content = message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part?.type === "text" && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("");
};

const getAgent = async () => {
  if (!agentPromise) {
    agentPromise = Promise.all([
      import("@langchain/openai"),
      import("langchain"),
      import("zod"),
      import("../prompts/systemPrompt.js"),
      import("./agricultureService.js"),
      import("./healthService.js"),
      import("./weatherService.js"),
    ]).then(([
      { ChatOpenAI },
      { createAgent, tool },
      { z },
      { systemPrompt },
      { agricultureService },
      { healthService },
      { weatherService },
    ]) => {
      const agricultureTool = tool(
        async ({ question }) => agricultureService.search(question),
        {
          name: "agricultureTool",
          description: "当用户询问农作物种植、病虫害、农事管理、农业知识等农业问题时调用。",
          schema: z.object({
            question: z.string().describe("用户提出的农业问题。"),
          }),
        },
      );

      const healthTool = tool(
        async ({ question }) => healthService.search(question),
        {
          name: "healthTool",
          description: "当用户询问疾病、症状、慢病管理、健康建议、生活习惯等健康问题时调用。",
          schema: z.object({
            question: z.string().describe("用户提出的健康问题。"),
          }),
        },
      );

      const weatherTool = tool(
        async ({ city }) => weatherService.getWeather(city),
        {
          name: "weatherTool",
          description: "当用户询问天气、气温、降雨、风速、出行或农事天气影响时调用。",
          schema: z.object({
            city: z.string().optional().describe("城市名称，例如西安、北京。"),
          }),
        },
      );

      const model = new ChatOpenAI({
        apiKey: kimiKey,
        model: "kimi-k2.6",
        temperature: 0.6,
        streamUsage: false,
        modelKwargs: {
          thinking: {
            type: "disabled",
          },
        },
        configuration: {
          baseURL: "https://api.moonshot.cn/v1",
        },
      });

      return createAgent({
        model,
        tools: [agricultureTool, healthTool, weatherTool],
        systemPrompt,
      });
    });
  }

  return agentPromise;
};

export const streamAgentReply = async ({ message, onToken }) => {
  const agent = await getAgent();
  const stream = await agent.stream(
    {
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    },
    {
      streamMode: "messages",
    },
  );

  for await (const chunk of stream) {
    const langChainMessage = Array.isArray(chunk) ? chunk[0] : chunk;
    const messageType = langChainMessage?._getType?.();

    if (messageType && messageType !== "ai") {
      continue;
    }

    const text = extractText(langChainMessage);

    if (text) {
      onToken(text);
    }
  }
};
