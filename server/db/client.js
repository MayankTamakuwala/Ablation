import { MongoClient } from "mongodb";

export const DB_NAME = process.env.MONGODB_DB || "ablation";

// Serverless functions are frozen and thawed between invocations, so the
// connection is cached on globalThis rather than in module scope.
const cache = globalThis.__ablationMongo || { client: null, promise: null };
globalThis.__ablationMongo = cache;

export function getClientPromise() {
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }

    cache.promise = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  }

  return cache.promise;
}

export async function getDb() {
  if (!cache.client) {
    cache.client = await getClientPromise();
  }

  return cache.client.db(DB_NAME);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

export async function closeDb() {
  if (cache.client) {
    await cache.client.close();
  }

  cache.client = null;
  cache.promise = null;
}
