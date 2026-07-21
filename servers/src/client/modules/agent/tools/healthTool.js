import { tool } from "langchain";
import { z } from "zod";
import { healthService } from "../services/healthService.js";

export const healthTool = tool(
  async ({ question }) => {
    return healthService.search(question);
  },
  {
    name: "healthTool",
    description: "当用户询问疾病、症状、慢病管理、健康建议、生活习惯等健康问题时调用。",
    schema: z.object({
      question: z.string().describe("用户提出的健康问题。"),
    }),
  },
);
