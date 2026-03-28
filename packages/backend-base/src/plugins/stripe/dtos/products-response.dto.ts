import { t } from "elysia";

const ProductDto = t.Object({
  id: t.String(),
  planName: t.String(),
  currency: t.String(),
  price: t.Nullable(t.Number()),
  recurring: t.Nullable(
    t.Object({
      interval: t.String(),
      interval_count: t.Number(),
      meter: t.Nullable(t.Any()),
      trial_period_days: t.Nullable(t.Number()),
      usage_type: t.String(),
    }),
  ),
});

export const ProductsResponseDto = t.Array(ProductDto);
