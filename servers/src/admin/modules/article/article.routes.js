import express from "express";
import { create, update, remove, list, detail } from "./article.controller.js";

const router = express.Router();

router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.get("/", list);
router.get("/:id", detail);

export default router;
