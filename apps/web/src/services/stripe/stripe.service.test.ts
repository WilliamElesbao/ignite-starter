import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StripeService } from "./stripe.service";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
};

describe("StripeService.subscription (unit)", () => {
  const service = new StripeService();

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    vi.clearAllMocks();
  });

  it("sends the correct payload and returns parsed url on success", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        url: "https://stripe.test/checkout-session",
      },
    });

    const payload = {
      priceId: "price_123",
      planName: "Pro",
      userId: "user_1",
    };

    const result = await service.subscription(payload);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:3000/api/stripe/subscription",
      payload,
    );

    expect(result.url).toBe("https://stripe.test/checkout-session");
  });

  it("throws a friendly error message when request fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    const payload = {
      priceId: "price_123",
      planName: "Pro",
      userId: "user_1",
    };

    await expect(service.subscription(payload)).rejects.toThrow(
      "Unable to create subscription.",
    );

    consoleErrorSpy.mockRestore();
  });
});
