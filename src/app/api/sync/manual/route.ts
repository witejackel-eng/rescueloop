import { syncWhopCompany } from "@/lib/whop/sync-company";
import { WhopApiError } from "@/lib/whop/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await syncWhopCompany();
    return Response.json(result);
  } catch (error) {
    if (error instanceof WhopApiError) {
      return Response.json(
        {
          connected: false,
          stage: "whop-api",
          status: error.status,
          error: error.responseBody,
        },
        { status: error.status },
      );
    }

    return Response.json(
      {
        connected: false,
        stage: "sync",
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}
