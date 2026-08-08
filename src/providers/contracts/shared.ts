// Shared provider types used across all contracts.

export interface RateLimitMetadata {
  remaining: number;
  resetAt: string; // ISO 8601
  limit: number;
}

export interface ProviderResult<T> {
  data: T;
  rateLimit?: RateLimitMetadata;
  sourceTimestamp: string;
}

// Typed provider errors — never generic.
export class ProviderError extends Error {
  readonly code: string;
  readonly provider: string;
  readonly retriable: boolean;

  constructor(params: {
    provider: string;
    code: string;
    message: string;
    retriable?: boolean;
  }) {
    super(params.message);
    this.name = "ProviderError";
    this.provider = params.provider;
    this.code = params.code;
    this.retriable = params.retriable ?? false;
  }
}

export class ProviderNotConfiguredError extends ProviderError {
  constructor(provider: string) {
    super({
      provider,
      code: "PROVIDER_NOT_CONFIGURED",
      message: `${provider} provider is not configured for this environment.`,
      retriable: false,
    });
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(provider: string, message?: string) {
    super({
      provider,
      code: "PROVIDER_UNAVAILABLE",
      message: message ?? `${provider} is currently unavailable.`,
      retriable: true,
    });
  }
}

export class ProviderPermissionDeniedError extends ProviderError {
  constructor(provider: string, permission: string) {
    super({
      provider,
      code: "PERMISSION_DENIED",
      message: `${provider} denied access: missing permission '${permission}'.`,
      retriable: false,
    });
  }
}

export class ProviderAuthenticationError extends ProviderError {
  constructor(provider: string) {
    super({
      provider,
      code: "AUTHENTICATION_FAILED",
      message: `${provider} authentication failed.`,
      retriable: false,
    });
  }
}

export class ProviderRateLimitError extends ProviderError {
  readonly resetAt: string;

  constructor(provider: string, resetAt: string) {
    super({
      provider,
      code: "RATE_LIMITED",
      message: `${provider} rate limit reached. Resets at ${resetAt}.`,
      retriable: true,
    });
    this.resetAt = resetAt;
  }
}

export class ProviderNotFoundError extends ProviderError {
  constructor(provider: string, resource: string, id: string) {
    super({
      provider,
      code: "NOT_FOUND",
      message: `${provider}: ${resource} '${id}' not found.`,
      retriable: false,
    });
  }
}
