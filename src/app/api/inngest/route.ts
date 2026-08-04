// Inngest serve route. Exposes the job functions to the Inngest platform.
// GET /api/inngest — Inngest introspection
// POST /api/inngest — Inngest function execution

import { serve } from "inngest/next";
import { inngest } from "@/server/jobs/client";
import { processWebhook, deliverIntervention } from "@/server/jobs/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processWebhook, deliverIntervention],
});
