import { ObjectId } from "mongodb";
import { getCollection } from "./client.js";

const COLLECTION = "runs";

async function runs() {
  return getCollection(COLLECTION);
}

function buildFilter(userId, { reproduced = "", search = "" }) {
  const filter = { userId };

  if (reproduced !== "") {
    filter.reproduced = reproduced;
  }

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ experimentLabel: pattern }, { baseModel: pattern }];
  }

  return filter;
}

export async function listRuns(
  userId,
  {
    reproduced = "",
    search = "",
    sort = "createdAt",
    order = "desc",
    limit = 20,
    skip = 0,
  } = {}
) {
  const collection = await runs();
  const filter = buildFilter(userId, { reproduced, search });
  const direction = order === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ [sort]: direction, _id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total };
}

export async function countsByReproduced(userId, { search = "" } = {}) {
  const collection = await runs();
  const filter = buildFilter(userId, { search });

  const rows = await collection
    .aggregate([{ $match: filter }, { $group: { _id: "$reproduced", n: { $sum: 1 } } }])
    .toArray();

  const counts = { all: 0, reproduced: 0, notReproduced: 0 };

  rows.forEach((row) => {
    if (row._id === true) {
      counts.reproduced += row.n;
    } else {
      counts.notReproduced += row.n;
    }
    counts.all += row.n;
  });

  return counts;
}

export async function getRun(userId, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await runs();
  return collection.findOne({ _id: new ObjectId(id), userId });
}

export async function createRun(userId, fields) {
  const collection = await runs();
  const now = new Date();

  const document = {
    userId,
    experimentLabel: fields.experimentLabel,
    baseModel: fields.baseModel,
    learningRate: fields.learningRate,
    batchSize: fields.batchSize,
    epochs: fields.epochs,
    seed: fields.seed,
    accuracy: fields.accuracy,
    loss: fields.loss,
    durationMinutes: fields.durationMinutes,
    reproduced: fields.reproduced === true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateRun(userId, id, fields) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await runs();

  return collection.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: { ...fields, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function deleteRun(userId, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const collection = await runs();
  const result = await collection.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}

export async function countRuns(userId) {
  const collection = await runs();
  return collection.countDocuments(userId ? { userId } : {});
}

// The catalog is shared read only reference data, so checking a model id
// against it is not a dependency on the experiments half of the project.
export async function catalogHasModel(modelId) {
  const models = await getCollection("models");
  return (await models.countDocuments({ _id: modelId }, { limit: 1 })) === 1;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
