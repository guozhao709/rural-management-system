import { tool } from "langchain";
import { z } from "zod";
import { weatherService } from "../services/weatherService.js";

export const weatherTool = tool(
  async ({ city }) => {
    return await weatherService.getWeather(city);
  },
  {
    name: "weatherTool",
    description: "当用户询问某个城市当前天气、明天天气、天气预报或出行天气时调用。",
    schema: z.object({
      city: z.string().describe("需要查询天气的城市名称，例如：西安。"),
    }),
  },
);
