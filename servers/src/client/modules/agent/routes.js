import express from "express";
import { postChat } from "./controllers/chatAgentController.js";

const router = express.Router();

router.post("/", postChat);

export default router;
