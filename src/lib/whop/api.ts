import "server-only";

const WHOP_API_BASE_URL = "https://api.whop.com/api/v1";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export const whopConfig = {
  get apiKey() {
    return requireEnv("WHOP_API_KEY");
  },
  get appId() {
    return requireEnv("NEXT_PUBLIC_WHOP_APP_ID");
  },
  get defaultCompanyId() {
    return requireEnv("WHOP_COMPANY_ID");
  },
};

type WhopPage<T> = {
  data?: T[];
  pagination?: { next_cursor?: string | null };
  page_info?: { next_cursor?: string | null };
};

export class WhopApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "WhopApiError";
  }
}

export async function whopGet<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL(`${WHOP_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${whopConfig.apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new WhopApiError(
      `Whop request failed: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }

  return body as T;
}

export async function whopListAll<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
  limit = 100,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await whopGet<WhopPage<T>>(path, {
      ...query,
      first: limit,
      after: cursor,
    });

    results.push(...(Array.isArray(page.data) ? page.data : []));
    cursor = page.pagination?.next_cursor ?? page.page_info?.next_cursor ?? undefined;
  } while (cursor);

  return results;
}
