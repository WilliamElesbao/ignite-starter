import type { ErrorCatalog } from "../../shared/errors/error-catalog";

export enum StripeErrorCode {
  STRIPE_INTERNAL_SERVER_ERROR = "STRIPE_INTERNAL_SERVER_ERROR",
  STRIPE_SIGNATURE_MISSING = "STRIPE_SIGNATURE_MISSING",
  STRIPE_PRICES_LIST_FAILED = "STRIPE_PRICES_LIST_FAILED",
  STRIPE_PRODUCTS_LIST_FAILED = "STRIPE_PRODUCTS_LIST_FAILED",
  STRIPE_CHECKOUT_CREATE_FAILED = "STRIPE_CHECKOUT_CREATE_FAILED",
  STRIPE_CHECKOUT_URL_MISSING = "STRIPE_CHECKOUT_URL_MISSING",
  STRIPE_SUBSCRIPTION_NOT_FOUND = "STRIPE_SUBSCRIPTION_NOT_FOUND",
  STRIPE_SUBSCRIPTION_RETRIEVE_FAILED = "STRIPE_SUBSCRIPTION_RETRIEVE_FAILED",
  STRIPE_SUBSCRIPTION_UPDATE_FAILED = "STRIPE_SUBSCRIPTION_UPDATE_FAILED",
  STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED = "STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED",
  STRIPE_SUBSCRIPTION_DETAILS_FAILED = "STRIPE_SUBSCRIPTION_DETAILS_FAILED",
  STRIPE_SUBSCRIPTION_DATA_INVALID = "STRIPE_SUBSCRIPTION_DATA_INVALID",
  STRIPE_PRICE_RETRIEVE_FAILED = "STRIPE_PRICE_RETRIEVE_FAILED",
  STRIPE_PRODUCT_RETRIEVE_FAILED = "STRIPE_PRODUCT_RETRIEVE_FAILED",
  STRIPE_SUBSCRIPTION_REVOKE_FAILED = "STRIPE_SUBSCRIPTION_REVOKE_FAILED",
  STRIPE_WEBHOOK_INVALID_SIGNATURE = "STRIPE_WEBHOOK_INVALID_SIGNATURE",
  STRIPE_WEBHOOK_METADATA_MISSING = "STRIPE_WEBHOOK_METADATA_MISSING",
  STRIPE_WEBHOOK_USER_UPDATE_FAILED = "STRIPE_WEBHOOK_USER_UPDATE_FAILED",
}

export const STRIPE_ERROR_MAP: ErrorCatalog<StripeErrorCode> = {
  [StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR]: {
    message: "Unexpected internal error",
    status: 500,
  },
  [StripeErrorCode.STRIPE_SIGNATURE_MISSING]: {
    message: "Missing Stripe signature",
    status: 400,
  },
  [StripeErrorCode.STRIPE_PRICES_LIST_FAILED]: {
    message: "Failed to retrieve Stripe prices",
    status: 502,
  },
  [StripeErrorCode.STRIPE_PRODUCTS_LIST_FAILED]: {
    message: "Failed to retrieve Stripe products",
    status: 502,
  },
  [StripeErrorCode.STRIPE_CHECKOUT_CREATE_FAILED]: {
    message: "Failed to create Stripe checkout session",
    status: 502,
  },
  [StripeErrorCode.STRIPE_CHECKOUT_URL_MISSING]: {
    message: "Failed to create subscription",
    status: 502,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND]: {
    message: "Subscription not found",
    status: 404,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_RETRIEVE_FAILED]: {
    message: "Failed to retrieve subscription",
    status: 502,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_UPDATE_FAILED]: {
    message: "Failed to update subscription",
    status: 502,
  },
  [StripeErrorCode.STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED]: {
    message: "Failed to persist subscription changes",
    status: 500,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_DETAILS_FAILED]: {
    message: "Failed to retrieve subscription details",
    status: 502,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_DATA_INVALID]: {
    message: "Subscription data is incomplete",
    status: 502,
  },
  [StripeErrorCode.STRIPE_PRICE_RETRIEVE_FAILED]: {
    message: "Failed to retrieve subscription price",
    status: 502,
  },
  [StripeErrorCode.STRIPE_PRODUCT_RETRIEVE_FAILED]: {
    message: "Failed to retrieve subscription product",
    status: 502,
  },
  [StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED]: {
    message: "Failed to revoke subscription",
    status: 502,
  },
  [StripeErrorCode.STRIPE_WEBHOOK_INVALID_SIGNATURE]: {
    message: "Webhook signature is invalid",
    status: 400,
  },
  [StripeErrorCode.STRIPE_WEBHOOK_METADATA_MISSING]: {
    message: "Missing subscription or user metadata",
    status: 400,
  },
  [StripeErrorCode.STRIPE_WEBHOOK_USER_UPDATE_FAILED]: {
    message: "Failed to process webhook",
    status: 500,
  },
};
