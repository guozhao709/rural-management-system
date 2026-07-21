import express from "express";
import {
  getVillagersByPage,
  getVillagersCount,
  deleteVillagerById,
  updateVillagerById,
} from "./repositories/villagerRepository.js";

const router = express.Router();

router.get("/lists", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 15;

  const list = await getVillagersByPage(page, pageSize);
  const total = await getVillagersCount();

  res.json({
    code: 200,
    message: "获取成功",
    data: {
      list,
      total,
      page,
      pageSize,
    },
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await deleteVillagerById(id);

  if (result.affectedRows > 0) {
    return res.json({ code: 200, message: "OK", data: null });
  }

  res.status(404).json({ code: 404, message: "未找到该村民信息", data: null });
});

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
    return res.json({ code: 200, message: "OK", data: null });
  }

  res.status(404).json({ code: 404, message: "未找到该村民信息", data: null });
});

export default router;
