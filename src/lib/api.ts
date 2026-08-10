export const AUTH_EXPIRED_EVENT = "hris:auth-expired";

let authExpiredDispatched = false;

export function resetAuthExpiredSignal() {
  authExpiredDispatched = false;
}

function dispatchAuthExpired() {
  if (authExpiredDispatched || typeof window === "undefined") return;
  authExpiredDispatched = true;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw Object.assign(new Error("Server is not responding"), {
      status: 0,
      network: true,
      cause: error,
    });
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) dispatchAuthExpired();
    throw Object.assign(new Error(body.error || "Request failed"), body, { status: res.status });
  }
  return body as T;
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
