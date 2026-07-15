export const CACHE_KEY = {
  USER_PLAN: "user-plan",
  STRIPE_PLANS: "stripe-plans",
} as const;

export const cacheKeys = {
  userPlan: (userId: string) => `${CACHE_KEY.USER_PLAN}:${userId}` as const,
  stripePlans: () => `${CACHE_KEY.STRIPE_PLANS}` as const,
};
