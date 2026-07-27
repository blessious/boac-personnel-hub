export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.error || "Request failed"), body, { status: res.status });
  }
  return body as T;
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
