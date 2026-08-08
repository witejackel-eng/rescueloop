// Whop adapter for the `NotificationsProvider` contract.
//
// Wraps `getWhopClient().notifications.create()` so business logic never
// imports the Whop SDK directly.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  NotificationResult,
  SendNotificationParams,
} from "@/providers/contracts";
import { assertWhopConfigured, mapWhopError } from "./errors";

/**
 * Whop implementation of the `NotificationsProvider` contract.
 *
 * The Whop notifications endpoint returns `{ success: boolean }` — it does
 * NOT return a provider message id. We map:
 *   - `success: true`  → `{ accepted: true,  providerMessageId: null }`
 *   - `success: false` → `{ accepted: false, providerMessageId: null }`
 *
 * The endpoint requires either `experience_id` or `company_id`. The
 * contract's `SendNotificationParams` carries `experienceId`, so we route
 * to the experience-scoped variant of the request.
 */
export class WhopNotificationsProvider {
  async send(params: SendNotificationParams): Promise<NotificationResult> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const response = await client.notifications.create({
        experience_id: params.experienceId,
        title: params.title,
        content: params.content,
        rest_path: params.restPath ?? undefined,
        user_ids: params.userIds.length > 0 ? params.userIds : undefined,
      });

      return {
        accepted: response.success === true,
        // Whop's notification API does not return a message id.
        providerMessageId: null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }
}

/** Re-exported for the bundle index. */
export const whopNotificationsProvider = new WhopNotificationsProvider();
