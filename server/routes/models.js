import express from "express";
import { requireAuth } from "../auth/passport.js";
import { countModels, listModels, listTasks } from "../db/models.js";
import { boundedInt } from "../validate.js";

const router = express.Router();

router.use(requireAuth);

// Shared reference data. Both collections of user work point at it by id.
router.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const task = typeof req.query.task === "string" ? req.query.task.trim() : "";
    const limit = boundedInt(req.query.limit, 40, 200);

    const items = await listModels({ search, task, limit });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get("/tasks", async (req, res, next) => {
  try {
    const [tasks, total] = await Promise.all([listTasks(), countModels()]);
    res.json({ tasks, total });
  } catch (error) {
    next(error);
  }
});

export default router;
