import { boundedInt, ValidationError } from "./validate.js";

// Only these fields can be sorted on, so the query string can never name an
// arbitrary document path.
export const RUN_SORT_FIELDS = [
  "createdAt",
  "accuracy",
  "loss",
  "learningRate",
  "batchSize",
  "epochs",
  "seed",
  "durationMinutes",
];

export const SORT_ORDERS = ["asc", "desc"];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

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

// Accepts a number or a numeric string, because form inputs hand back strings.
function number(
  value,
  label,
  { required = false, min = -Infinity, max = Infinity, integer = false, above } = {}
) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError(label + " is required");
    }
    return undefined;
  }

  let parsed = value;

  if (typeof value === "string") {
    parsed = value.trim() === "" ? NaN : Number(value);
  }

  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new ValidationError(label + " must be a number");
  }

  if (integer && !Number.isInteger(parsed)) {
    throw new ValidationError(label + " must be a whole number");
  }

  if (above !== undefined && parsed <= above) {
    throw new ValidationError(label + " must be greater than " + above);
  }

  if (parsed < min) {
    throw new ValidationError(label + " must be at least " + min);
  }

  if (parsed > max) {
    throw new ValidationError(label + " must be at most " + max);
  }

  return parsed;
}

export function validateRun(body, { partial = false } = {}) {
  requireObject(body);

  const run = {};
  const required = !partial;

  function assign(key, value) {
    if (value !== undefined) {
      run[key] = value;
    }
  }

  assign(
    "experimentLabel",
    text(body.experimentLabel, "Experiment label", { required, max: 120 })
  );
  assign("baseModel", text(body.baseModel, "Base model", { required, max: 160 }));
  assign(
    "learningRate",
    number(body.learningRate, "Learning rate", { required, above: 0, max: 10 })
  );
  assign(
    "batchSize",
    number(body.batchSize, "Batch size", { required, integer: true, min: 1, max: 65536 })
  );
  assign(
    "epochs",
    number(body.epochs, "Epochs", { required, integer: true, min: 1, max: 10000 })
  );
  assign(
    "seed",
    number(body.seed, "Seed", { required, integer: true, min: 0, max: 4294967295 })
  );
  assign("accuracy", number(body.accuracy, "Accuracy", { required, min: 0, max: 1 }));
  assign("loss", number(body.loss, "Loss", { required, min: 0, max: 1000000 }));
  assign(
    "durationMinutes",
    number(body.durationMinutes, "Duration", { required, min: 0, max: 525600 })
  );

  if (body.reproduced !== undefined) {
    if (typeof body.reproduced !== "boolean") {
      throw new ValidationError("Reproduced must be true or false");
    }
    run.reproduced = body.reproduced;
  } else if (!partial) {
    run.reproduced = false;
  }
  if (partial && Object.keys(run).length === 0) {
    throw new ValidationError("No valid fields to update");
  }

  return run;
}

// Turns the list query string into trusted values. Anything unrecognised is
// rejected rather than ignored, so a caller never gets an unfiltered or
// unsorted list while believing otherwise.
export function parseRunQuery(query) {
  let sort = "createdAt";

  if (query.sort !== undefined && query.sort !== "") {
    if (!RUN_SORT_FIELDS.includes(query.sort)) {
      throw new ValidationError("Cannot sort by that field");
    }
    sort = query.sort;
  }

  let order = "desc";

  if (query.order !== undefined && query.order !== "") {
    if (!SORT_ORDERS.includes(query.order)) {
      throw new ValidationError("Order must be asc or desc");
    }
    order = query.order;
  }

  let reproduced = "";

  if (query.reproduced !== undefined && query.reproduced !== "") {
    if (query.reproduced === "true") {
      reproduced = true;
    } else if (query.reproduced === "false") {
      reproduced = false;
    } else {
      throw new ValidationError("Reproduced filter must be true or false");
    }
  }

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const limit =
    boundedInt(query.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const skip = boundedInt(query.skip, 0, 1000000);

  return { sort, order, reproduced, search, limit, skip };
}
