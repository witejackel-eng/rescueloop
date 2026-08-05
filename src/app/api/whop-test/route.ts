export const runtime = "nodejs";

const WHOP_API_BASE_URL = "https://api.whop.com/api/v1";

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export async function GET(): Promise<Response> {
  const apiKey = process.env.WHOP_API_KEY;
  const companyId = process.env.WHOP_COMPANY_ID;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

  if (!apiKey || !companyId || !appId) {
    return json(
      {
        connected: false,
        stage: "configuration",
        missing: {
          WHOP_API_KEY: !apiKey,
          WHOP_COMPANY_ID: !companyId,
          NEXT_PUBLIC_WHOP_APP_ID: !appId,
        },
      },
      500,
    );
  }

  try {
    const response = await fetch(
      `${WHOP_API_BASE_URL}/courses?company_id=${encodeURIComponent(companyId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return json(
        {
          connected: false,
          stage: "whop-api",
          status: response.status,
          companyId,
          appId,
          error: body,
        },
        response.status,
      );
    }

    const courseCount = Array.isArray(body?.data) ? body.data.length : 0;

    return json({
      connected: true,
      companyId,
      appId,
      courseCount,
    });
  } catch (error) {
    return json(
      {
        connected: false,
        stage: "network",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
}
