import { query } from "../../../../common/db/index.js";
import { normalizeCropName } from "../../agriculture/tools/userAgrDic.js";

const MAX_RESULTS = 5;

const buildLikeText = (question) => `%${question.trim()}%`;

const extractCropName = (question) => {
  const text = question.trim();
  return normalizeCropName(text);
};

const formatKnowledgeRows = (rows) => {
  return rows.map((row, index) => {
    return [
      `【农业知识${index + 1}】`,
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
      `【历史农业分析${index + 1}】`,
      `作物：${row.crop_name}`,
      `地区：${row.region}`,
      `内容：${row.analysis_text}`,
      `更新时间：${row.updated_at}`,
    ].join("\n");
  });
};

export const agricultureService = {
  async search(question) {
    const keyword = typeof question === "string" ? question.trim() : "";

    if (!keyword) {
      return "未查询到相关农业知识。";
    }

    const likeText = buildLikeText(keyword);
    const cropName = extractCropName(keyword);
    const cropLikeText = buildLikeText(cropName);

    const knowledgeRows = await query(
      `
SELECT title, content, tags, source
FROM agriculture_knowledge
WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
ORDER BY updated_at DESC, id DESC
LIMIT ?
`,
      [likeText, likeText, likeText, MAX_RESULTS],
    );

    const analysisRows = await query(
      `
SELECT crop_name, region, analysis_text, updated_at
FROM crop_analysis
WHERE crop_name = ?
   OR crop_name LIKE ?
   OR region LIKE ?
   OR analysis_text LIKE ?
   OR analysis_text LIKE ?
ORDER BY
  CASE
    WHEN crop_name = ? THEN 0
    WHEN crop_name LIKE ? THEN 1
    ELSE 2
  END,
  updated_at DESC,
  id DESC
LIMIT ?
`,
      [
        cropName,
        cropLikeText,
        likeText,
        likeText,
        cropLikeText,
        cropName,
        cropLikeText,
        MAX_RESULTS,
      ],
    );

    const resultText = [
      ...formatKnowledgeRows(knowledgeRows),
      ...formatAnalysisRows(analysisRows),
    ].join("\n\n");

    return resultText || "未查询到相关农业知识。";
  },
};
