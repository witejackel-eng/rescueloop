import "server-only";

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;

if (!apiKey) {
  throw new Error(
    "WHOP_API_KEY is not configured. Add it to .env.local for local development and to your hosting environment for production.",
  );
}

export const whopsdk = new Whop({ apiKey });

export function getConfiguredWhopCompanyId(): string {
  const companyId = process.env.WHOP_COMPANY_ID;

  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID is not configured.");
  }

  if (!companyId.startsWith("biz_")) {
    throw new Error("WHOP_COMPANY_ID must begin with biz_.");
  }

  return companyId;
}
