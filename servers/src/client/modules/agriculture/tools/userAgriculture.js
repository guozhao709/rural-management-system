import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeCropName } from "./userAgrDic.js";
import { execute, queryOne } from "../../../../common/db/index.js";
import OpenAI from "openai";

const localEnvironment = {
  region: "陕西省西安市长安区",
  soilType: "黄土土壤",
  averageTemperature: "13℃",
  annualRainfall: "650mm",
  sunlight: "光照充足",
  irrigationCondition: "灌溉条件良好",
  commonRisks: ["春旱", "低温冻害", "病虫害"],
  suitableCrops: ["小麦", "玉米", "番茄"],
};

const weatherData = {
  location: "西安",
  currentTemperature: "21℃",
  humidity: "63%",
  windSpeed: "12km/h",
  condition: "晴",
  forecast: [
    { day: "今天", weather: "晴", temperature: "21℃~27℃" },
    { day: "明天", weather: "多云", temperature: "19℃~25℃" },
    { day: "后天", weather: "小雨", temperature: "17℃~22℃" },
  ],
  agricultureImpact: "未来两天气温适宜，有利于作物生长，但后续降雨可能增加田间湿度。",
};

const marketData = {
  crop: "小麦",
  currentPrice: "2.82元/kg",
  priceTrend: "平稳上涨",
  marketDemand: "较高",
  nearbyPurchasers: ["西安粮食收购站", "长安区农业合作社", "陕西粮贸有限公司"],
  recentAnalysis: "近期加工企业采购需求增加，小麦市场价格略有上涨。",
};

const kimiKey = process.env.KIMI_API_KEY;
if (!kimiKey) {
  throw new Error(
    "Missing KIMI_API_KEY. Please set KIMI_API_KEY in the root .env file.",
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../prompts");

const systemPrompt = () => {
  return fs.readFileSync(path.join(DATA_DIR, "agriculture.system.txt"), "utf-8");
};

const prompt = systemPrompt();

const client = new OpenAI({
  apiKey: kimiKey,
  baseURL: "https://api.moonshot.cn/v1",
});

export const saveCropAnalysis = async ({ cropName, region, analysisText }) => {
  return execute(
    `
    INSERT INTO crop_analysis (crop_name, region, analysis_text)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      analysis_text = VALUES(analysis_text),
      updated_at = CURRENT_TIMESTAMP
    `,
    [cropName, region, analysisText],
  );
};

export const getLatestCropAnalysis = async (crop) => {
  const cropName = normalizeCropName(crop);

  const analysisTable = await queryOne(
    `
      SELECT analysis_text, updated_at
      FROM crop_analysis
      WHERE crop_name = ?
      ORDER BY updated_at DESC
      LIMIT 1
      `,
    [cropName],
  );

  return {
    cropName,
    analysis: {
      text: analysisTable?.analysis_text,
      analysisTime: analysisTable?.updated_at,
    },
  };
};

export const getAgriculture = async (crop) => {
  const cropName = normalizeCropName(crop);

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
作物名称：
${cropName}

本地农业环境：
${JSON.stringify(localEnvironment)}

实时天气：
${JSON.stringify(weatherData)}

市场行情：
${JSON.stringify(marketData)}
      `,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 1,
  });

  const text = completion.choices[0].message.content;
  const now = new Date();

  await saveCropAnalysis({
    cropName,
    region: localEnvironment.region,
    analysisText: text,
  });

  return {
    cropName,
    text,
    analysisTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
  };
};
