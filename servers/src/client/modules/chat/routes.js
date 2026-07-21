import express from "express";
import {
  getConversation,
  getLatest,
  getMessages,
  patchRead,
  postMessage,
} from "./controllers/chatController.js";

const router = express.Router();

router.get("/conversation", getConversation);
router.get("/messages/latest", getLatest);
router.get("/messages", getMessages);
router.post("/messages", postMessage);
router.patch("/read", patchRead);

export default router;
