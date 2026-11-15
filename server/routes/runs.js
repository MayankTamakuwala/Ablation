import express from "express";
import { requireAuth } from "../auth/passport.js";
import {
  catalogHasModel,
  countsByReproduced,
  createRun,
  deleteRun,
  getRun,
  listRuns,
  updateRun,
} from "../db/runs.js";
import { ValidationError } from "../validate.js";
import { parseRunQuery, validateRun } from "../validate-runs.js";

const router = express.Router();

router.use(requireAuth);

async function requireCatalogModel(baseModel) {
  if (baseModel !== undefined && !(await catalogHasModel(baseModel))) {
    throw new ValidationError("Base model must be chosen from the catalog");
  }
}

router.get("/", async (req, res, next) => {
  try {
    const { sort, order, reproduced, search, limit, skip } = parseRunQuery(req.query);
    const userId = req.user._id.toString();

    const [{ items, total }, counts] = await Promise.all([
      listRuns(userId, { reproduced, search, sort, order, limit, skip }),
      countsByReproduced(userId, { search }),
    ]);

    res.json({ items, total, counts, sort, order, limit, skip });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const fields = validateRun(req.body);
    await requireCatalogModel(fields.baseModel);

    const created = await createRun(req.user._id.toString(), fields);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const run = await getRun(req.user._id.toString(), req.params.id);

    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    res.json(run);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = validateRun(req.body, { partial: true });
    await requireCatalogModel(fields.baseModel);

    const updated = await updateRun(req.user._id.toString(), req.params.id, fields);

    if (!updated) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await deleteRun(req.user._id.toString(), req.params.id);

    if (!removed) {
      res.status(404).json({ error: "Run not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
