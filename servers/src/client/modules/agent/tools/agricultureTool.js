import { tool } from "langchain";
import { z } from "zod";
import { agricultureService } from "../services/agricultureService.js";

export const agricultureTool = tool(
  async ({ question }) => {
    return agricultureService.search(question);
  },
  {
    name: "agricultureTool",
    description: "当用户询问农作物种植、病虫害、农事管理、农业知识等农业问题时调用。",
    schema: z.object({
      question: z.string().describe("用户提出的农业问题。"),
    }),
  },
);
