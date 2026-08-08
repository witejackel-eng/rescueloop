// Client-side helper for making authenticated requests to internal API routes.
// Reads the token from sessionStorage (set during auth gate flow).

export class InternalApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "InternalApiError";
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("rl_internal_token");
}

export async function internalFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  if (!token) throw new InternalApiError("Not authenticated", 401);

  const res = await fetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new InternalApiError(
      data.error || `Request failed (${res.status})`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export async function internalPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  return internalFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
