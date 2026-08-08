// Provider contract index. Exports all provider interfaces and shared types.

export * from "./shared";
export * from "./courses-provider";
export * from "./products-provider";
export * from "./memberships-provider";
export * from "./progress-provider";
export * from "./notifications-provider";
export * from "./identity-provider";

// The complete provider bundle — all contracts a provider implementation must satisfy.
export interface ProviderBundle {
  courses: CoursesProvider;
  products: ProductsProvider;
  memberships: MembershipsProvider;
  progress: ProgressProvider;
  notifications: NotificationsProvider;
  identity: IdentityProvider;
}

import type { CoursesProvider } from "./courses-provider";
import type { ProductsProvider } from "./products-provider";
import type { MembershipsProvider } from "./memberships-provider";
import type { ProgressProvider } from "./progress-provider";
import type { NotificationsProvider } from "./notifications-provider";
import type { IdentityProvider } from "./identity-provider";
