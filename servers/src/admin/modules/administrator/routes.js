import express from "express";
import { readAdmin, writeAllAdmin } from "../auth/services/adminStorage.js";

const router = express.Router();

router.get("/lists", async (req, res) => {
  const adminArr = await readAdmin();
  res.json({
    code: 200,
    message: "获取成功",
    data: adminArr,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const adminArr = await readAdmin();
  const index = adminArr.findIndex((item) => item.adminID === id);

  if (index === -1) {
    return res.status(404).json({
      code: 404,
      message: "管理员不存在",
      data: null,
    });
  }

  adminArr.splice(index, 1);
  await writeAllAdmin(adminArr);
  res.json({
    code: 200,
    message: "删除成功",
    data: null,
  });
});

router.put("/:id", async (req, res) => {
  const { adminID, adminname, password, phone, role } = req.body;
  const adminArr = await readAdmin();
  const index = adminArr.findIndex((item) => item.adminID === adminID);

  if (index === -1) {
    return res.status(404).json({
      code: 404,
      message: "管理员不存在",
      data: null,
    });
  }

  adminArr[index].adminname = adminname;
  adminArr[index].password = password;
  adminArr[index].phone = phone;
  adminArr[index].role = role;

  await writeAllAdmin(adminArr);
  res.json({
    code: 200,
    message: "更新成功",
    data: null,
  });
});

export default router;
