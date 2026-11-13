import { ObjectId } from "mongodb";
import { getCollection } from "./client.js";

const COLLECTION = "experiments";

async function experiments() {
  return getCollection(COLLECTION);
}

function buildFilter(userId, { status = "", search = "" }) {
  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: pattern }, { question: pattern }, { dataset: pattern }];
  }

  return filter;
}

export async function listExperiments(
  userId,
  { status = "", search = "", limit = 20, skip = 0 } = {}
) {
  const collection = await experiments();
  const filter = buildFilter(userId, { status, search });

  // _id breaks ties so a row cannot appear on two pages when several
  // experiments share an updatedAt value.
  const [items, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ updatedAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total };
}

/**
 * Counts per status for the filter chips.
 *
 * These deliberately ignore the status filter and respect the search box. The
 * chips are how you switch status, so they have to show what you would get by
 * switching, not what you already have selected.
 */
export async function countsByStatus(userId, { search = "" } = {}) {
  const collection = await experiments();
  const filter = buildFilter(userId, { search });

  const rows = await collection
    .aggregate([{ $match: filter }, { $group: { _id: "$status", n: { $sum: 1 } } }])
    .toArray();

  const counts = { all: 0, planned: 0, running: 0, concluded: 0, abandoned: 0 };

  rows.forEach((row) => {
    if (row._id in counts) {
      counts[row._id] = row.n;
    }
    counts.all += row.n;
  });

  return counts;
}

export async function getExperiment(userId, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await experiments();
  return collection.findOne({ _id: new ObjectId(id), userId });
}

export async function createExperiment(userId, fields) {
  const collection = await experiments();
  const now = new Date();

  const document = {
    userId,
    title: fields.title,
    question: fields.question,
    dataset: fields.dataset,
    baseModel: fields.baseModel,
    status: fields.status,
    notes: fields.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateExperiment(userId, id, fields) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await experiments();

  return collection.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: { ...fields, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function deleteExperiment(userId, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const collection = await experiments();
  const result = await collection.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}

export async function countExperiments(userId) {
  const collection = await experiments();
  return collection.countDocuments(userId ? { userId } : {});
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
