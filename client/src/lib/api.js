/**
 * One place where every request to the API is made.
 *
 * Same origin in both environments: Vite proxies /api to the Express process
 * in development, and Vercel serves both from one domain in production. That
 * means the session cookie travels on its own and no CORS middleware exists
 * anywhere in the project.
 */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  // A crash in the error handler itself would send HTML, so parsing is
  // allowed to fail without masking the status code.
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error || "Something went wrong", response.status);
  }

  return payload;
}

export function buildQuery(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const serialised = query.toString();
  return serialised ? "?" + serialised : "";
}
