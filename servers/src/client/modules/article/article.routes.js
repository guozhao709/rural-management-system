import express from "express";
import { banner, list, detail } from "./article.controller.js";

const router = express.Router();

router.get("/banner", banner);
router.get("/", list);
router.get("/:id", detail);

export default router;
