import express from "express";
import { requireAuth } from "../auth/passport.js";
import {
  createExperiment,
  deleteExperiment,
  getExperiment,
  listExperiments,
  updateExperiment,
} from "../db/experiments.js";
import { EXPERIMENT_STATUSES, validateExperiment, ValidationError } from "../validate.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "";

    if (status && !EXPERIMENT_STATUSES.includes(status)) {
      throw new ValidationError("Unknown status filter");
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const items = await listExperiments(req.user._id.toString(), { status, search });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const fields = validateExperiment(req.body);
    const created = await createExperiment(req.user._id.toString(), fields);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const experiment = await getExperiment(req.user._id.toString(), req.params.id);

    if (!experiment) {
      res.status(404).json({ error: "Experiment not found" });
      return;
    }

    res.json(experiment);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = validateExperiment(req.body, { partial: true });
    const updated = await updateExperiment(
      req.user._id.toString(),
      req.params.id,
      fields
    );

    if (!updated) {
      res.status(404).json({ error: "Experiment not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await deleteExperiment(req.user._id.toString(), req.params.id);

    if (!removed) {
      res.status(404).json({ error: "Experiment not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
