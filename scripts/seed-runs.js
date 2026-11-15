/**
 * Seeds the runs collection.
 *
 * Runs are synthetic and owned by the demo account. Experiment labels and
 * base models are copied onto each run, which is how the real app stores them.
 * If the demo account has experiments, their titles and base models are used so
 * the data looks coherent. If it has none, models from the catalog stand in, so
 * this script never depends on the experiments half being seeded.
 *
 * Run with:  npm run seed:runs
 */

import { closeDb, getCollection } from "../server/db/client.js";
import { findUserByUsername } from "../server/db/users.js";

const RUN_TARGET = Number(process.env.SEED_RUNS) || 1100;
const DEMO_USERNAME = "demo";

const LEARNING_RATES = [1e-5, 2e-5, 3e-5, 5e-5, 1e-4, 3e-4, 1e-3];
const BATCH_SIZES = [8, 16, 32, 64, 128];
const EPOCHS = [1, 2, 3, 4, 5, 10, 20];
const SEEDS = [0, 1, 7, 13, 42, 1337, 2024, 3407];

// Same generator as the experiments seed, so reseeding is reproducible.
function makeRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20261119);

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function intBetween(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function round(value, places = 4) {
  return Number(value.toFixed(places));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function loadThreads(userId) {
  const experiments = await getCollection("experiments");
  const own = await experiments
    .find({ userId }, { projection: { title: 1, baseModel: 1 } })
    .toArray();

  if (own.length > 0) {
    return own.map((e) => ({ label: e.title.slice(0, 120), baseModel: e.baseModel }));
  }

  const models = await getCollection("models");
  const catalog = await models
    .find({ task: { $ne: "unspecified" } }, { projection: { _id: 1, name: 1 } })
    .limit(300)
    .toArray();

  if (catalog.length === 0) {
    throw new Error("No experiments or models found. Run npm run seed first.");
  }

  return catalog.map((m) => ({
    label: m.name.slice(0, 100) + " sweep",
    baseModel: m._id,
  }));
}

function buildThread(userId, thread) {
  const baseline = 0.55 + random() * 0.4;
  const batchSize = pick(BATCH_SIZES);
  const epochs = pick(EPOCHS);
  const count = intBetween(1, 5);
  const runs = [];

  for (let i = 0; i < count; i += 1) {
    const learningRate = random() < 0.6 ? pick(LEARNING_RATES) : 3e-5;
    const runEpochs = random() < 0.7 ? epochs : pick(EPOCHS);
    const lrPenalty = learningRate > 3e-4 ? 0.06 : 0;
    const accuracy = clamp(
      baseline + Math.min(runEpochs, 10) * 0.004 - lrPenalty + (random() - 0.5) * 0.05,
      0.2,
      0.995
    );
    const createdAt = hoursAgo(intBetween(1, 18 * 30 * 24));

    runs.push({
      userId,
      experimentLabel: thread.label,
      baseModel: thread.baseModel,
      learningRate,
      batchSize: random() < 0.8 ? batchSize : pick(BATCH_SIZES),
      epochs: runEpochs,
      seed: pick(SEEDS),
      accuracy: round(accuracy),
      loss: round((1 - accuracy) * 2.2 + random() * 0.08),
      durationMinutes: round(runEpochs * (4 + random() * 36), 1),
      reproduced: random() < 0.35,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return runs;
}

async function seed() {
  const runsCollection = await getCollection("runs");

  await Promise.all([
    runsCollection.createIndex({ userId: 1, createdAt: -1 }),
    runsCollection.createIndex({ userId: 1, reproduced: 1 }),
    runsCollection.createIndex({ userId: 1, accuracy: -1 }),
  ]);
  console.log("Indexes created.");

  const demo = await findUserByUsername(DEMO_USERNAME);

  if (!demo) {
    throw new Error("Demo account not found. Run npm run seed first.");
  }

  const userId = String(demo._id);
  const threads = await loadThreads(userId);

  const removed = await runsCollection.deleteMany({ userId });

  if (removed.deletedCount > 0) {
    console.log("Cleared " + removed.deletedCount + " existing demo runs.");
  }

  const documents = [];

  while (documents.length < RUN_TARGET) {
    documents.push(...buildThread(userId, pick(threads)));
  }

  const trimmed = documents.slice(0, RUN_TARGET);
  await runsCollection.insertMany(trimmed);

  console.log("Synthetic runs seeded: " + trimmed.length);
}

seed()
  .then(() => closeDb())
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
