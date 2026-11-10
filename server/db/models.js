import { getCollection } from "./client.js";

const COLLECTION = "models";

async function models() {
  return getCollection(COLLECTION);
}

// The catalog is shared reference data: every signed in user reads the same rows.
export async function listModels({ search = "", task = "", limit = 40 } = {}) {
  const collection = await models();
  const filter = {};

  if (search) {
    filter._id = { $regex: escapeRegex(search), $options: "i" };
  }

  if (task) {
    filter.task = task;
  }

  return collection.find(filter).sort({ downloads: -1 }).limit(limit).toArray();
}

export async function listTasks() {
  const collection = await models();
  const tasks = await collection.distinct("task");
  return tasks.filter(Boolean).sort();
}

export async function countModels() {
  const collection = await models();
  return collection.countDocuments();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
