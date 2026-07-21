import authRoutes from "../admin/modules/auth/routes.js";
import administratorRoutes from "../admin/modules/administrator/routes.js";
import articleRoutes from "../admin/modules/article/article.routes.js";
import chatRoutes from "../admin/modules/chat/routes.js";
import villagerRoutes from "../admin/modules/villagers/routes.js";
import { authMiddleware } from "../common/middleware/adminAuth.js";

const adminRouter = (app) => {
  app.use("/api/v1/admin/auth", authRoutes);
  app.use("/api/v1/admin/administrator", authMiddleware, administratorRoutes);
  app.use("/api/v1/admin/articles", authMiddleware, articleRoutes);
  app.use("/api/v1/admin/villagers", authMiddleware, villagerRoutes);
  app.use("/admin/chat", chatRoutes);
};

export default adminRouter;
