// Official Whop SDK server-only client.
// Uses @whop/sdk (the current official package) with Standard Webhooks.
// Never imported by client components — this module touches secrets.

import { Whop } from "@whop/sdk";

/**
 * The singleton Whop server client.
 *
 * Constructor options:
 * - apiKey: the app API key (WHOP_API_KEY), must be prefixed with "Bearer"
 *   by the caller if using a raw key. The SDK accepts the raw key and
 *   handles the Bearer prefix internally.
 * - webhookKey: base64-encoded webhook secret (WHOP_WEBHOOK_SECRET).
 *   The SDK expects this to be base64-encoded, matching how Whop
 *   provides the secret in the developer dashboard.
 * - appID: required for verifyUserToken (NEXT_PUBLIC_WHOP_APP_ID).
 */
export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: process.env.WHOP_WEBHOOK_SECRET
    ? btoa(process.env.WHOP_WEBHOOK_SECRET)
    : undefined,
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
