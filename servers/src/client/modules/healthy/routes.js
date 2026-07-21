import express from "express";
import { getHealthy, getLatestHealthAnalysis } from "./tools/userHealthy.js";

const router = express.Router();

router.post("/info", async (req, res) => {
  try {
    const {
      userId = req.user?.phone ?? "anonymous",
      basicInfo = {},
      symptoms = {},
      habits = {},
      medicalHistory = {},
    } = req.body;

    const data = await getHealthy({
      userId,
      basicInfo,
      symptoms,
      habits,
      medicalHistory,
    });

    res.json({
      code: 200,
      message: "获取成功",
      data,
    });
  } catch (error) {
    console.error("健康分析生成失败:", error);

    res.status(500).json({
      code: 500,
      message: "健康分析生成失败",
      data: {},
    });
  }
});

router.get("/info/db/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = await getLatestHealthAnalysis(userId);

    res.json({
      code: 200,
      message: "获取成功",
      data: {
        userId,
        analysis,
      },
    });
  } catch (error) {
    console.error("健康分析查询失败:", error);

    res.status(500).json({
      code: 500,
      message: "健康分析查询失败",
      data: {},
    });
  }
});

export default router;
