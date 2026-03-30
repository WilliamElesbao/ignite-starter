import { createErrorDto } from "../../../../shared/dtos/error.dto";
import { authUnauthorizedErrorDto } from "../../../auth/dtos/auth-error.dto";
import { StripeErrorCode } from "../../stripe.errors";

export { authUnauthorizedErrorDto as stripeUnauthorizedErrorDto };

export const stripeInternalErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR,
] as const);

export const stripeProductsErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_PRICES_LIST_FAILED,
  StripeErrorCode.STRIPE_PRODUCTS_LIST_FAILED,
] as const);

export const stripeCreateSubscription404ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
] as const);

export const stripeCreateSubscription502ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_CHECKOUT_CREATE_FAILED,
  StripeErrorCode.STRIPE_CHECKOUT_URL_MISSING,
] as const);

export const stripeUpdateSubscription500ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR,
  StripeErrorCode.STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED,
] as const);

export const stripeUpdateSubscription502ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SUBSCRIPTION_RETRIEVE_FAILED,
  StripeErrorCode.STRIPE_SUBSCRIPTION_UPDATE_FAILED,
] as const);

export const stripeSubscriptionNotFoundErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
] as const);

export const stripeDetails502ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SUBSCRIPTION_DETAILS_FAILED,
  StripeErrorCode.STRIPE_SUBSCRIPTION_DATA_INVALID,
  StripeErrorCode.STRIPE_PRICE_RETRIEVE_FAILED,
  StripeErrorCode.STRIPE_PRODUCT_RETRIEVE_FAILED,
] as const);

export const stripeRevoke500ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR,
  StripeErrorCode.STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED,
] as const);

export const stripeRevoke502ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED,
] as const);

export const stripeWebhook400ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_SIGNATURE_MISSING,
  StripeErrorCode.STRIPE_WEBHOOK_INVALID_SIGNATURE,
  StripeErrorCode.STRIPE_WEBHOOK_METADATA_MISSING,
] as const);

export const stripeWebhook500ErrorDto = createErrorDto([
  StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR,
  StripeErrorCode.STRIPE_WEBHOOK_USER_UPDATE_FAILED,
] as const);
