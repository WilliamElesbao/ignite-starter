export const PLAN_LIMITS = {
  free: {
    maxQrCodes: 3,
    maxFileSizeBytes: 2 * 1024 * 1024, // 2MB
  },
  pro: {
    maxQrCodes: 10,
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export const FREE_FEATURES = [
  "manual-setup",
  "manual-auth-configuration",
  "manual-stripe-configuration",
  "manual-database-setup",
  "manual-email-configuration",
] as const;

export const PRO_FEATURES = [
  "rocket-propulsion",
  "preconfigured-auth",
  "preconfigured-stripe",
  "preconfigured-database",
  "preconfigured-email",
  "docker-ready",
  "production-ready",
] as const;

export type Feature =
  | (typeof FREE_FEATURES)[number]
  | (typeof PRO_FEATURES)[number];
