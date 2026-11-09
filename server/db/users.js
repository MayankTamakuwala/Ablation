import { ObjectId } from "mongodb";
import { getCollection } from "./client.js";

const COLLECTION = "users";

async function users() {
  return getCollection(COLLECTION);
}

export async function findUserByUsername(username) {
  const collection = await users();
  return collection.findOne({ username: username.toLowerCase() });
}

export async function findUserById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await users();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function createUser({ username, displayName, passwordHash }) {
  const collection = await users();

  const document = {
    username: username.toLowerCase(),
    displayName,
    passwordHash,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(document);
  return { ...document, _id: result.insertedId };
}

export function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
  };
}
