// Provider contract: Identity and access verification.

export interface VerifiedUser {
  userId: string;
  appId: string;
}

export type AccessLevel = "no_access" | "admin" | "customer";

export interface AccessCheckResult {
  accessLevel: AccessLevel;
  hasAccess: boolean;
}

export interface IdentityProvider {
  /** Verify a Whop user token from request headers. Throws typed errors. */
  verifyUserToken(headers: Headers): Promise<VerifiedUser>;

  /** Check if a user has access to a company. Returns access level. */
  checkAccess(companyId: string, userId: string): Promise<AccessCheckResult>;
}
