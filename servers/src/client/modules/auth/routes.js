import express from "express";
import { userRegister, userLogin } from "./services/userStorage.js";
import { getUserToken } from "../../../common/middleware/userAuth.js";
import { authMiddleware } from "../../../common/middleware/userAuth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const backData = await userRegister(req.body);

  res.status(200).json({
    code: 200,
    message: backData.success ? "注册成功" : backData.message,
    data: {},
  });
});

router.post("/login", async (req, res) => {
  const backData = await userLogin(req.body);

  if (!backData.success) {
    return res.status(200).json({
      code: 200,
      message: backData.message,
      data: {},
    });
  }

  const token = getUserToken(backData.user);
  if (!token) {
    return res.status(500).json({
      code: 500,
      message: "生成 token 失败",
      data: {},
    });
  }

  res.status(200).json({
    code: 200,
    message: "登录成功",
    data: {
      token,
      userInfo: backData.user,
    },
  });
});

router.get("/token/verify", authMiddleware, (req, res) => {
  res.status(200).json({
    code: 200,
    message: "token 有效",
    data: {},
  });
});

export default router;
