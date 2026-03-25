import axios from "axios";
import {
  ProductListDto,
  SubscriptionDetailsPayloadDto,
  SubscriptionDetailsResponseDto,
  SubscriptionPayloadDto,
  SubscriptionResponseDto,
  UpdateSubscriptionResponseDto,
} from "./dtos";

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe`;

/**
 * Service for interacting with Stripe API endpoints.
 */
export class StripeService {
  /**
   * Fetch all available products from Stripe.
   */
  async products(): Promise<ProductListDto> {
    try {
      const { data } = await axios.get(`${BASE_URL}/products`);

      return ProductListDto.parse(data);
    } catch (error) {
      console.error("[StripeService] Failed to fetch products", error);
      throw new Error("Unable to load products.");
    }
  }

  /**
   * Create a subscription based on plan and price ID.
   * @param payload - Object containing the priceId and planName.
   * @returns A Stripe checkout URL that the user should be redirected to.
   */
  async subscription(
    payload: SubscriptionPayloadDto,
  ): Promise<SubscriptionResponseDto> {
    try {
      const parsed = SubscriptionPayloadDto.parse(payload);
      const { data } = await axios.post(`${BASE_URL}/subscription`, parsed);

      return SubscriptionResponseDto.parse(data);
    } catch (error) {
      console.error("[StripeService] Failed to create subscription", error);
      throw new Error("Unable to create subscription.");
    }
  }

  /**
   * Retrieve details of a specific subscription.
   */
  async subscriptionDetails(
    payload: SubscriptionDetailsPayloadDto,
  ): Promise<SubscriptionDetailsResponseDto> {
    try {
      const parsed = SubscriptionDetailsPayloadDto.parse(payload);
      const { data } = await axios.post(
        `${BASE_URL}/subscription/details`,
        parsed,
      );
      console.log("[StripeService] Subscription details:", data);
      return SubscriptionDetailsResponseDto.parse(data);
    } catch (error) {
      console.error(
        "[StripeService] Failed to fetch subscription details",
        error,
      );
      throw new Error("Unable to load subscription details.");
    }
  }

  /**
   * Update an active subscription with a new plan.
   * @param payload - Object containing new plan priceId and planName.
   * @returns The updated subscription object from Stripe.
   */
  async updateSubscription(
    payload: SubscriptionPayloadDto,
  ): Promise<UpdateSubscriptionResponseDto> {
    try {
      const parsed = SubscriptionPayloadDto.parse(payload);
      const { data } = await axios.patch(`${BASE_URL}/subscription`, parsed);

      return UpdateSubscriptionResponseDto.parse(data);
    } catch (error) {
      console.error("[StripeService] Failed to update subscription", error);
      throw new Error("Unable to update subscription.");
    }
  }

  /**
   * Cancel the user's current subscription.
   */
  async cancelSubscription(): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/subscription`);
    } catch (error) {
      console.error("[StripeService] Failed to cancel subscription", error);
      throw new Error("Unable to cancel subscription.");
    }
  }
}
