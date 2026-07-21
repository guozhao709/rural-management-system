import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execute, queryOne } from "../../../../common/db/index.js";
import OpenAI from "openai";

const kimiKey = process.env.KIMI_API_KEY;
if (!kimiKey) {
  throw new Error(
    "Missing KIMI_API_KEY. Please set KIMI_API_KEY in the root .env file.",
  );
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../prompts");

const healthySystemPrompt = () => {
  return fs.readFileSync(path.join(DATA_DIR, "healthy.system.txt"), "utf-8");
};

const prompt = healthySystemPrompt();

const client = new OpenAI({
  apiKey: kimiKey,
  baseURL: "https://api.moonshot.cn/v1",
});

const formatInputForPrompt = (value) => {
  if (value === undefined || value === null || value === "") {
    return "{}";
  }

  return typeof value === "string" ? value : JSON.stringify(value);
};

const serializeInput = (value) => {
  if (value === undefined || value === null || value === "") {
    return JSON.stringify({});
  }

  return JSON.stringify(value);
};

const parseModelJson = (text) => {
  const trimmedText = text.trim();

  try {
    return JSON.parse(trimmedText);
  } catch (error) {
    const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw error;
    }

    return JSON.parse(jsonMatch[0]);
  }
};

export const saveHealthAnalysis = async ({
  userId,
  basicInfo,
  symptoms,
  habits,
  medicalHistory,
  analysisJson,
}) => {
  const existingAnalysis = await queryOne(
    `
      SELECT id
      FROM health_analysis
      WHERE user_id = ?
      LIMIT 1
      `,
    [userId],
  );

  if (existingAnalysis) {
    return execute(
      `
      UPDATE health_analysis
      SET
        basic_info = ?,
        symptoms = ?,
        habits = ?,
        medical_history = ?,
        analysis_json = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      `,
      [
        serializeInput(basicInfo),
        serializeInput(symptoms),
        serializeInput(habits),
        serializeInput(medicalHistory),
        JSON.stringify(analysisJson),
        userId,
      ],
    );
  }

  return execute(
    `
    INSERT INTO health_analysis (
      user_id,
      basic_info,
      symptoms,
      habits,
      medical_history,
      analysis_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      serializeInput(basicInfo),
      serializeInput(symptoms),
      serializeInput(habits),
      serializeInput(medicalHistory),
      JSON.stringify(analysisJson),
    ],
  );
};
export const getHealthy = async ({
  userId = "anonymous",
  basicInfo = {},
  symptoms = {},
  habits = {},
  medicalHistory = {},
}) => {
  const completion = await client.chat.completions.create({
    model: "kimi-k2.6",

    messages: [
      {
        role: "system",
        content: prompt,
      },

      {
        role: "user",
        content: `
鍩虹鍋ュ悍淇℃伅锟?${formatInputForPrompt(basicInfo)}

褰撳墠鐥囩姸锟?${formatInputForPrompt(symptoms)}

鐢熸椿涔犳儻锟?${formatInputForPrompt(habits)}

鏃㈠線鐥呭彶锟?${formatInputForPrompt(medicalHistory)}
      `,
      },
    ],

    temperature: 1,
  });

  const text = completion.choices[0].message.content;
  const analysis = parseModelJson(text);
  const now = new Date();

  await saveHealthAnalysis({
    userId,
    basicInfo,
    symptoms,
    habits,
    medicalHistory,
    analysisJson: analysis,
  });

  return {
    userId,
    analysis,
    analysisTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
  };
};

export const getLatestHealthAnalysis = async (userId) => {
  const row = await queryOne(
    `
      SELECT analysis_json, updated_at
      FROM health_analysis
      WHERE user_id = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
      `,
    [userId],
  );

  if (!row) {
    return null;
  }

  return {
    analysis: JSON.parse(row.analysis_json),
    analysisTime: row.updated_at,
  };
};
