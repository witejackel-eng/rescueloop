// Whop adapter for the `ProductsProvider` contract.
//
// Wraps `getWhopClient().products.list()` and `retrieve()` so business logic
// never imports the Whop SDK directly.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  ExternalProduct,
  ListProductsParams,
  ProductPage,
  ProviderNotFoundError,
} from "@/providers/contracts";
import type {
  Product,
  ProductListItem,
} from "@whop/sdk/resources/shared";
import type { CursorPage } from "@whop/sdk/core/pagination";
import { APIError, NotFoundError } from "@whop/sdk";
import { assertWhopConfigured, mapWhopError } from "./errors";

/**
 * Whop implementation of the `ProductsProvider` contract.
 *
 * NOTE: Whop's `Product` / `ProductListItem` types do not carry pricing or
 * billing-cycle fields — pricing lives on the related `Plan` resource.
 * TODO: Verify against real Whop API during Phase 2 — for now we surface
 * placeholder values (`priceCents: 0`, `currency: "usd"`,
 * `billingCycle: "monthly"`) and the upper layers can hydrate from
 * `client.plans.list({ product_id })` if needed.
 *
 * The Whop SDK's `products.list()` requires `account_id` (the company's
 * store-front id). We map the contract's `companyId` to `account_id` —
 * TODO: Verify against real Whop API during Phase 2 whether the contract's
 * `companyId` should instead be a `biz_` company id (the SDK accepts both,
 * but only one is valid per credentials).
 */
export class WhopProductsProvider {
  async list(params: ListProductsParams): Promise<ProductPage> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const page = (await client.products.list({
        account_id: params.companyId,
        after: params.cursor ?? undefined,
        first: params.pageSize ?? undefined,
      })) as CursorPage<ProductListItem>;

      const items = (page.data ?? []).map(mapProductListItem);

      return {
        items,
        nextCursor: page.page_info?.end_cursor ?? null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }

  async retrieve(productId: string): Promise<ExternalProduct | null> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const product = await client.products.retrieve(productId);
      return mapProduct(product);
    } catch (error) {
      if (error instanceof NotFoundError || (error instanceof APIError && error.status === 404)) {
        return null;
      }
      if (error instanceof ProviderNotFoundError) {
        return null;
      }
      throw mapWhopError(error);
    }
  }
}

// ─── Mappers ─────────────────────────────────────────────────

function mapProductListItem(product: ProductListItem): ExternalProduct {
  return {
    id: product.id,
    name: product.title,
    // Pricing fields are not on the list response.
    // TODO: Verify against real Whop API during Phase 2.
    priceCents: 0,
    currency: "usd",
    billingCycle: "monthly",
    isPublished: product.visibility === "visible",
    sourceTimestamp: product.updated_at,
  };
}

function mapProduct(product: Product): ExternalProduct {
  return {
    id: product.id,
    name: product.title,
    // Pricing fields are on `Plan`, not `Product`.
    // TODO: Verify against real Whop API during Phase 2.
    priceCents: 0,
    currency: "usd",
    billingCycle: "monthly",
    isPublished: product.visibility === "visible",
    sourceTimestamp: product.updated_at,
  };
}

/** Re-exported for the bundle index. */
export const whopProductsProvider = new WhopProductsProvider();
