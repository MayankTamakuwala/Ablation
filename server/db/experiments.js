import { ObjectId } from "mongodb";
import { getCollection } from "./client.js";

const COLLECTION = "experiments";

async function experiments() {
  return getCollection(COLLECTION);
}

export async function listExperiments(userId, { status = "", search = "" } = {}) {
  const collection = await experiments();
  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: pattern }, { question: pattern }, { dataset: pattern }];
  }

  return collection.find(filter).sort({ updatedAt: -1 }).toArray();
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
