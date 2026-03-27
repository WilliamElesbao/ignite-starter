import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

// The route imports a Prisma database connection; for this e2e-style test we
// don't touch the database, so we can safely mock the module to avoid having
// to provide a real Prisma client or database.
vi.mock("@/database/connection", () => ({
  db: {},
}));

// The route also imports a dayjs wrapper; it isn't exercised in this test, so
// we mock it with a minimal implementation.
vi.mock("@/lib/dayjs", () => ({
  default: (...args: unknown[]) => ({
    toDate: () => new Date(),
    args,
  }),
}));

import { authClient } from "@/lib/better-auth/auth-client";
import { stripe } from "@/lib/stripe";
import { POST } from "./route";

describe("/api/stripe/subscription POST (e2e-style)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a checkout url when user is authenticated", async () => {
    (
      authClient.getSession as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      user: { id: "user_1", email: "user@example.com" },
    });

    (
      stripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      url: "https://stripe.test/checkout-session",
    });

    const request = new Request(
      "http://localhost:3000/api/stripe/subscription",
      {
        method: "POST",
        body: JSON.stringify({
          priceId: "price_123",
          planName: "Pro",
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);

    const body = (await response.json()) as { url: string };
    expect(body.url).toBe("https://stripe.test/checkout-session");

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      line_items: [{ price: "price_123", quantity: 1 }],
      mode: "subscription",
      success_url: "http://localhost:3000",
      cancel_url: "http://localhost:3000",
      customer_email: "user@example.com",
      metadata: {
        userId: "user_1",
        planName: "Pro",
      },
    });
  });

  it("returns 401 when there is no authenticated user", async () => {
    (
      authClient.getSession as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);

    const request = new Request(
      "http://localhost:3000/api/stripe/subscription",
      {
        method: "POST",
        body: JSON.stringify({ priceId: "price_123", planName: "Pro" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
