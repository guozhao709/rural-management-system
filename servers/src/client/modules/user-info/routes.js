import express from "express";
import { updateVillagerById } from "./services/updateVillager.js";
import { getLatestHealthAnalysis } from "../healthy/tools/userHealthy.js";

const router = express.Router();

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, birthday, gender, password } = req.body;
  const result = await updateVillagerById(id, {
    name,
    phone,
    address,
    birthday,
    gender,
    password,
  });

  if (result.affectedRows > 0) {
    return res.status(200).json({ code: 200, message: "已更新完成", data: {} });
  }

  res.status(404).json({ code: 404, message: "更新失败", data: {} });
});

router.post("/healthy", async (req, res) => {
  const userId = req.body.phone;
  const data = await getLatestHealthAnalysis(userId);

  res.json({
    code: 200,
    message: "获取成功",
    data: data ?? {},
  });
});

export default router;
