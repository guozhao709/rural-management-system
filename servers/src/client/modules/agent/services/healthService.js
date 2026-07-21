import { query } from "../../../../common/db/index.js";

const MAX_RESULTS = 5;

const buildLikeText = (question) => `%${question.trim()}%`;

const formatKnowledgeRows = (rows) => {
  return rows.map((row, index) => {
    return [
      `【健康知识${index + 1}】`,
      `标题：${row.title}`,
      `内容：${row.content}`,
      row.tags ? `标签：${row.tags}` : "",
      row.source ? `来源：${row.source}` : "",
    ].filter(Boolean).join("\n");
  });
};

const formatAnalysisRows = (rows) => {
  return rows.map((row, index) => {
    return [
      `【历史健康分析${index + 1}】`,
      `用户：${row.user_id}`,
      `基础信息：${row.basic_info}`,
      `当前症状：${row.symptoms}`,
      `生活习惯：${row.habits}`,
      `既往病史：${row.medical_history}`,
      `分析内容：${row.analysis_json}`,
      `更新时间：${row.updated_at}`,
    ].join("\n");
  });
};

export const healthService = {
  async search(question) {
    const keyword = typeof question === "string" ? question.trim() : "";

    if (!keyword) {
      return "未查询到相关健康知识。";
    }

    const likeText = buildLikeText(keyword);

    const knowledgeRows = await query(
      `
SELECT title, content, tags, source
FROM health_knowledge
WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
ORDER BY updated_at DESC, id DESC
LIMIT ?
`,
      [likeText, likeText, likeText, MAX_RESULTS],
    );

    const analysisRows = await query(
      `
SELECT user_id, basic_info, symptoms, habits, medical_history, analysis_json, updated_at
FROM health_analysis
WHERE basic_info LIKE ?
   OR symptoms LIKE ?
   OR habits LIKE ?
   OR medical_history LIKE ?
   OR analysis_json LIKE ?
ORDER BY updated_at DESC, id DESC
LIMIT ?
`,
      [likeText, likeText, likeText, likeText, likeText, MAX_RESULTS],
    );

    const resultText = [
      ...formatKnowledgeRows(knowledgeRows),
      ...formatAnalysisRows(analysisRows),
    ].join("\n\n");

    return resultText || "未查询到相关健康知识。";
  },
};
