import jwt from "jsonwebtoken";

const secret_key = "Userguozhao";

export const getUserToken = (user) => {
  return jwt.sign({
    id: user.id,
    phone: user.phone,
    name: user.name,
  }, secret_key, {
    expiresIn: "24h",
  });
};

export const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  const [type, token] = auth?.split(" ") ?? [];

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      code: 401,
      message: "未登录或 token 无效",
      data: null,
    });
  }

  try {
    const payload = jwt.verify(token, secret_key);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      code: 401,
      message: "未登录或 token 无效",
      data: null,
    });
  }
};
