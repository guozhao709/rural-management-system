import userAuthRoutes from "../client/modules/auth/routes.js";
import { authMiddleware } from "../common/middleware/userAuth.js";
import userAIchatRoutes from "../client/modules/ai-chat/routes.js";
import agentRoutes from "../client/modules/agent/routes.js";
import userAgricultureRoutes from "../client/modules/agriculture/routes.js";
import articleRoutes from "../client/modules/article/article.routes.js";
import userChatRoutes from "../client/modules/chat/routes.js";
import userHealthyRoutes from "../client/modules/healthy/routes.js";
import userInfoRoutes from "../client/modules/user-info/routes.js";

const userRouter = (app) => {
  app.use("/api/v1/user/auth", userAuthRoutes);
  app.use("/api/v1/user/aichat", authMiddleware, userAIchatRoutes);
  app.use("/api/v1/user/argiculture", authMiddleware, userAgricultureRoutes);
  app.use("/api/v1/user/healthy", authMiddleware, userHealthyRoutes);
  app.use("/api/v1/user/info", authMiddleware, userInfoRoutes);
  app.use("/api/v1/articles", articleRoutes);
  app.use("/api/agent", authMiddleware, agentRoutes);
  app.use("/api/chat", authMiddleware, userChatRoutes);
};

export default userRouter;
