import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

// scrypt ships with Node, so there is no native build step on the deploy host
// and no extra dependency to request approval for.
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);

  return salt + ":" + derived.toString("hex");
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.includes(":")) {
    return false;
  }

  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");

  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(expected, derived);
}
