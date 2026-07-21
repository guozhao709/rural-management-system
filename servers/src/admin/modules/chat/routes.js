import express from "express";
import { authMiddleware, requireRole } from "../../../common/middleware/adminAuth.js";
import {
  getConversations,
  getMessages,
  getMessagesAfterLastId,
  patchRead,
  postMessage,
} from "./controllers/chatController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("super_admin"));

router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages/after", getMessagesAfterLastId);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", postMessage);
router.patch("/conversations/:conversationId/read", patchRead);

export default router;
