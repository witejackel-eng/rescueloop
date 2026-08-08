import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureProductsProvider — returns deterministic product data
// from the local fixture store. Implements `ProductsProvider`.
// ─────────────────────────────────────────────────────────────

import type {
  ExternalProduct,
  ListProductsParams,
  ProductPage,
  ProductsProvider,
} from "@/providers/contracts";
import {
  decodeCursor,
  encodeCursor,
  getProducts,
  makeFixtureRateLimit,
} from "./fixtures-data";

const DEFAULT_PAGE_SIZE = 25;

export class FixtureProductsProvider implements ProductsProvider {
  async list(params: ListProductsParams): Promise<ProductPage> {
    // Fixture store is single-tenant; any companyId returns the same set.
    void params.companyId;

    const all = getProducts();
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);

    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < all.length ? encodeCursor(nextOffset) : null;

    return {
      items,
      nextCursor,
      rateLimit: makeFixtureRateLimit(),
    };
  }

  async retrieve(productId: string): Promise<ExternalProduct | null> {
    const all = getProducts();
    return all.find((p) => p.id === productId) ?? null;
  }
}
