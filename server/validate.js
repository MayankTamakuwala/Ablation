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
