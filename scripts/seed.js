/**
 * Seeds the two collections this half of the project owns.
 *
 *   models       1,000 real records from the Hugging Face Hub API (free, no
 *                key). Shared reference data behind the base model picker.
 *                Read only: nothing in the app writes to it.
 *   experiments  synthetic records owned by the demo account, so a reviewer
 *                who signs in as demo sees a populated list.
 *
 * The runs collection belongs to the other half of the project and is seeded
 * by its own script.
 *
 * Run with:  npm run seed
 */

import { closeDb, getCollection } from "../server/db/client.js";
import { createUser, findUserByUsername } from "../server/db/users.js";
import { hashPassword } from "../server/auth/password.js";
import { EXPERIMENT_STATUSES } from "../server/validate.js";

const MODEL_TARGET = Number(process.env.SEED_MODELS) || 1000;
const EXPERIMENT_TARGET = Number(process.env.SEED_EXPERIMENTS) || 1040;

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "ablation2026";
const DEMO_DISPLAY_NAME = "Demo Researcher";

const DATASETS = [
  "imdb",
  "sst2",
  "ag_news",
  "squad_v2",
  "common_voice_17",
  "cifar100",
  "conll2003",
  "gsm8k",
  "mmlu-stem",
  "wikitext-103",
  "banking77",
  "xsum",
  "librispeech",
  "hellaswag",
];

const QUESTIONS = [
  "Does a lower learning rate recover the accuracy we lose at batch size 64?",
  "Is bf16 costing us anything measurable against fp32 on this task?",
  "How many epochs before the validation curve stops moving?",
  "Does freezing the encoder change the result or just the wall clock?",
  "Is the gain from the larger checkpoint worth three times the training time?",
  "Which optimizer actually converges on this dataset?",
  "Does the seed explain the spread we saw last week?",
  "Can we match the baseline with half the batch size?",
  "Is label smoothing helping or hiding the problem?",
  "Does warmup matter once the learning rate is this low?",
  "How much accuracy do we give up going from fp32 to fp16?",
  "Does more data beat more epochs here?",
  "Is gradient clipping doing anything now that the loss is stable?",
  "Does the tokenizer change explain the drop, or was it the data split?",
];

const NOTES = [
  "Started from the paper's settings and changed one thing at a time.",
  "Rerun after the data loader fix. Earlier numbers are not comparable.",
  "Hit an out of memory error at the larger batch size, dropped it and kept going.",
  "The spread across seeds is wider than the effect we were measuring.",
  "Good result but the checkpoint was overwritten, needs a rerun to confirm.",
  "Parked this. The effect is real but too small to build on.",
  "Reproduced on a second machine with the same seed.",
  "Comparison is not controlled, two things moved at once. Do not cite this one.",
  "",
];

// A small deterministic generator, so reseeding produces the same database.
// Fitting, given the project is about being able to reproduce a result.
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

const random = makeRandom(20261118);

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function intBetween(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function fetchModels() {
  const url =
    "https://huggingface.co/api/models?limit=" +
    MODEL_TARGET +
    "&sort=downloads&direction=-1";

  console.log("Fetching " + MODEL_TARGET + " models from the Hugging Face Hub...");

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error("Hugging Face API returned " + response.status);
  }

  const payload = await response.json();

  return payload.map((model) => {
    const slash = model.id.indexOf("/");

    return {
      _id: model.id,
      author: slash === -1 ? "huggingface" : model.id.slice(0, slash),
      name: slash === -1 ? model.id : model.id.slice(slash + 1),
      task: model.pipeline_tag || "unspecified",
      library: model.library_name || "unspecified",
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      tags: Array.isArray(model.tags) ? model.tags.slice(0, 12) : [],
      createdAt: model.createdAt ? new Date(model.createdAt) : null,
    };
  });
}

function buildExperiments(userId, models) {
  // Prefer models that declare a task, so the picker shows useful rows.
  const usable = models.filter((model) => model.task !== "unspecified");
  const source = usable.length > 0 ? usable : models;
  const experiments = [];

  // Spread the log over roughly eighteen months of work.
  const windowHours = 18 * 30 * 24;

  for (let index = 0; index < EXPERIMENT_TARGET; index += 1) {
    const model = source[Math.floor(random() * source.length)];
    const dataset = pick(DATASETS);
    const createdAt = hoursAgo(intBetween(1, windowHours));

    experiments.push({
      userId,
      title: model.name.slice(0, 60) + " on " + dataset,
      question: pick(QUESTIONS),
      dataset,
      baseModel: model._id,
      status: pick(EXPERIMENT_STATUSES),
      notes: pick(NOTES),
      createdAt,
      updatedAt: new Date(createdAt.getTime() + intBetween(0, 96) * 60 * 60 * 1000),
    });
  }

  return experiments;
}

async function createIndexes() {
  const [users, models, experiments] = await Promise.all([
    getCollection("users"),
    getCollection("models"),
    getCollection("experiments"),
  ]);

  await Promise.all([
    users.createIndex({ username: 1 }, { unique: true }),
    models.createIndex({ downloads: -1 }),
    models.createIndex({ task: 1 }),
    experiments.createIndex({ userId: 1, updatedAt: -1 }),
    experiments.createIndex({ userId: 1, status: 1 }),
  ]);

  console.log("Indexes created.");
}

async function ensureDemoUser() {
  const existing = await findUserByUsername(DEMO_USERNAME);

  if (existing) {
    console.log("Demo account already exists.");
    return existing;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await createUser({
    username: DEMO_USERNAME,
    displayName: DEMO_DISPLAY_NAME,
    passwordHash,
  });

  console.log("Demo account created: " + DEMO_USERNAME + " / " + DEMO_PASSWORD);
  return user;
}

async function seed() {
  await createIndexes();

  const demo = await ensureDemoUser();
  const userId = String(demo._id);

  const modelDocuments = await fetchModels();
  const modelsCollection = await getCollection("models");

  await modelsCollection.bulkWrite(
    modelDocuments.map((model) => ({
      replaceOne: { filter: { _id: model._id }, replacement: model, upsert: true },
    }))
  );

  console.log("Models in catalog: " + (await modelsCollection.countDocuments()));

  const experimentsCollection = await getCollection("experiments");

  // Only the demo account's synthetic rows are replaced. Anything a real
  // account created is left alone.
  const removed = await experimentsCollection.deleteMany({ userId });

  if (removed.deletedCount > 0) {
    console.log("Cleared " + removed.deletedCount + " existing demo experiments.");
  }

  const experimentDocuments = buildExperiments(userId, modelDocuments);
  await experimentsCollection.insertMany(experimentDocuments);

  console.log("Synthetic experiments seeded: " + experimentDocuments.length);
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
