// ─────────────────────────────────────────────────────────────
// PX05 — Versioned Rate Card
// Configurable cost rates for per-tenant estimation.
// Version history preserved for audit / re-calculation.
// ─────────────────────────────────────────────────────────────

import type { RateCard, RateCardVersion, RateCardRates } from "@/lib/types/cost";

// ── Rate Card Versions ──────────────────────────────────────

const V1_RATES: RateCardRates = {
  costPerMember: 1.20,
  costPerThousandEvents: 0.15,
  costPerJob: 0.008,
  costPerProviderCall: 0.002,
  paymentProcessingRate: 0.029,
  paymentProcessingFixed: 0.30,
  estimatedTransactionsPerMonth: 12,
  baseInfrastructureCost: 4.50,
  supportCostPerMember: 0.40,
};

const V2_RATES: RateCardRates = {
  costPerMember: 1.05,
  costPerThousandEvents: 0.12,
  costPerJob: 0.006,
  costPerProviderCall: 0.0015,
  paymentProcessingRate: 0.029,
  paymentProcessingFixed: 0.30,
  estimatedTransactionsPerMonth: 12,
  baseInfrastructureCost: 3.80,
  supportCostPerMember: 0.35,
};

const V3_RATES: RateCardRates = {
  costPerMember: 0.95,
  costPerThousandEvents: 0.10,
  costPerJob: 0.005,
  costPerProviderCall: 0.0012,
  paymentProcessingRate: 0.026,
  paymentProcessingFixed: 0.25,
  estimatedTransactionsPerMonth: 12,
  baseInfrastructureCost: 3.50,
  supportCostPerMember: 0.30,
};

const V1: RateCardVersion = {
  version: 1,
  effectiveDate: "2024-07-01",
  description: "Initial rate card — launch pricing",
  rates: V1_RATES,
};

const V2: RateCardVersion = {
  version: 2,
  effectiveDate: "2024-10-01",
  description: "Reduced infra after DB optimisation",
  rates: V2_RATES,
};

const V3: RateCardVersion = {
  version: 3,
  effectiveDate: "2025-01-15",
  description: "Negotiated payment processor rates + scale efficiencies",
  rates: V3_RATES,
};

// ── Exported Rate Card ──────────────────────────────────────

export const RATE_CARD: RateCard = {
  current: V3,
  history: [V1, V2, V3],
};

/** Get rates for a specific version, or current if not found */
export function getRatesForVersion(version?: number): RateCardRates {
  if (version === undefined) return RATE_CARD.current.rates;
  const entry = RATE_CARD.history.find((v) => v.version === version);
  return entry ? entry.rates : RATE_CARD.current.rates;
}

/** Get full version entry for a specific version */
export function getVersionEntry(version: number): RateCardVersion | undefined {
  return RATE_CARD.history.find((v) => v.version === version);
}
