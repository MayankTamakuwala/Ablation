export const EXPERIMENT_STATUSES = ["planned", "running", "concluded", "abandoned"];

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object");
  }
}

function text(value, label, { required = false, max = 300 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError(label + " is required");
    }
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(label + " must be text");
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new ValidationError(label + " is required");
  }

  if (trimmed.length > max) {
    throw new ValidationError(label + " must be " + max + " characters or fewer");
  }

  return trimmed;
}

function oneOf(value, allowed, label, { required = false, fallback } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError(label + " is required");
    }
    return fallback;
  }

  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new ValidationError(label + " must be one of " + allowed.join(", "));
  }

  return value;
}

export function validateExperiment(body, { partial = false } = {}) {
  requireObject(body);

  const experiment = {};
  const required = !partial;

  const title = text(body.title, "Title", { required, max: 120 });
  if (title !== undefined) {
    experiment.title = title;
  }

  const question = text(body.question, "Research question", { required, max: 500 });
  if (question !== undefined) {
    experiment.question = question;
  }

  const dataset = text(body.dataset, "Dataset", { required, max: 120 });
  if (dataset !== undefined) {
    experiment.dataset = dataset;
  }

  const baseModel = text(body.baseModel, "Base model", { required, max: 160 });
  if (baseModel !== undefined) {
    experiment.baseModel = baseModel;
  }

  if (!partial || body.status !== undefined) {
    experiment.status = oneOf(body.status, EXPERIMENT_STATUSES, "Status", {
      fallback: "planned",
    });
  }

  const notes = text(body.notes, "Notes", { max: 2000 });
  if (notes !== undefined) {
    experiment.notes = notes;
  }

  // A partial update that named no known field is a client bug, not an
  // instruction to stamp updatedAt and change nothing.
  if (partial && Object.keys(experiment).length === 0) {
    throw new ValidationError("No valid fields to update");
  }

  return experiment;
}

export function validateCredentials(body, { withDisplayName = false } = {}) {
  requireObject(body);

  const username = text(body.username, "Username", { required: true, max: 32 });

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new ValidationError(
      "Username can only contain letters, numbers, dots, dashes and underscores"
    );
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  if (body.password.length > 200) {
    throw new ValidationError("Password must be 200 characters or fewer");
  }

  const credentials = { username: username.toLowerCase(), password: body.password };

  if (withDisplayName) {
    credentials.displayName =
      text(body.displayName, "Display name", { max: 60 }) || username;
  }

  return credentials;
}

// Query string numbers arrive as strings and can be anything at all, so a
// bad value falls back instead of reaching Mongo as a NaN limit.
export function boundedInt(value, fallback, max) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}
