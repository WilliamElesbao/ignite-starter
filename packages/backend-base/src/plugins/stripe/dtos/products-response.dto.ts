import { t } from "elysia";

const ProductDto = t.Object({
  id: t.String(),
  planName: t.String(),
  price: t.String(),
  recurring: t.Nullable(
    t.Union([
      t.Literal("day"),
      t.Literal("week"),
      t.Literal("month"),
      t.Literal("year"),
    ]),
  ),
});

export const ProductsResponseDto = t.Array(ProductDto);
