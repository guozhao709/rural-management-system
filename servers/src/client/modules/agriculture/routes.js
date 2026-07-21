import express from "express";
import {
  getAgriculture,
  getLatestCropAnalysis,
} from "./tools/userAgriculture.js";

const router = express.Router();

router.get("/info/:crop", async (req, res) => {
  const { crop } = req.params;
  const data = await getAgriculture(crop);

  res.json({
    code: 200,
    message: "获取成功",
    data: data ?? {},
  });
});

router.get("/info/db/:crop", async (req, res) => {
  const { crop } = req.params;
  const data = await getLatestCropAnalysis(crop);

  res.json({
    code: 200,
    message: "获取成功",
    data,
  });
});

export default router;
