import jwt from "jsonwebtoken";

const secret_key = "guozhao";

const getNumericAdminId = (adminID) => {
  const id = Number.parseInt(String(adminID ?? "").replace(/\D/g, ""), 10);
  return Number.isInteger(id) ? id : null;
};

export const getAdminToken = (admin) => {
  return jwt.sign({
    id: getNumericAdminId(admin.adminID),
    role: admin.role,
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

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: "权限不足",
        data: null,
      });
    }

    next();
  };
};
