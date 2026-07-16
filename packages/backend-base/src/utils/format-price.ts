/**
 * Formats a product price from cents to readable currency string.
 *
 * @param product - Object with `currency` and `amount` (in cents)
 * @returns A string formatted according to locale and currency
 */
export const formatPrice = ({
  currency,
  amount,
}: {
  currency: "usd" | "brl";
  amount?: number | null;
}): string => {
  return new Intl.NumberFormat(currency === "usd" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amount ?? 0) / 100);
};
