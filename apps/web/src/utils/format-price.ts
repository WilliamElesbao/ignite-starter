import type { ProductDto } from "@/services/stripe/dtos";

/**
 * Formats a product price from cents to readable currency string.
 *
 * @param product - Object with `currency` and `price` (in cents)
 * @returns A string formatted according to locale and currency
 */
export const formatPrice = ({
  currency,
  price,
}: Pick<ProductDto, "currency" | "price">): string => {
  return new Intl.NumberFormat(currency === "usd" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(price / 100);
};
