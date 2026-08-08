// Provider contract: Product data source.

export interface ExternalProduct {
  id: string; // Stable external ID (Whop product ID)
  name: string;
  priceCents: number;
  currency: string;
  billingCycle: "monthly" | "annual" | "one_time";
  isPublished: boolean;
  sourceTimestamp: string;
}

export interface ProductPage {
  items: ExternalProduct[];
  nextCursor: string | null;
  rateLimit?: RateLimitMetadata;
}

export interface ListProductsParams {
  companyId: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface ProductsProvider {
  list(params: ListProductsParams): Promise<ProductPage>;
  retrieve(productId: string): Promise<ExternalProduct | null>;
}

import type { RateLimitMetadata } from "./shared";
