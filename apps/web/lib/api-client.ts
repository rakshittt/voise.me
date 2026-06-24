import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

async function getAuthToken(): Promise<string | null> {
  const { getToken } = await auth();
  return getToken();
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

// Proxy helpers for Next.js route handlers.
// Forwards FastAPI's exact status code + body to the browser;
// returns 503 if the backend is unreachable (ECONNREFUSED, etc.).
async function proxyRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const token = await getAuthToken();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => null);
    return Response.json(data ?? { detail: res.statusText }, { status: res.status });
  } catch {
    return Response.json({ detail: "Service temporarily unavailable" }, { status: 503 });
  }
}

export const proxyGet = (path: string) => proxyRequest("GET", path);
export const proxyPost = (path: string, body: unknown) => proxyRequest("POST", path, body);
export const proxyPut = (path: string, body: unknown) => proxyRequest("PUT", path, body);
export const proxyPatch = (path: string, body: unknown) => proxyRequest("PATCH", path, body);
export const proxyDelete = (path: string) => proxyRequest("DELETE", path);
