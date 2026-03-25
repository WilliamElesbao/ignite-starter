import { stripe } from "@/lib/stripe";

export async function GET() {
  const prices = await stripe.prices.list({
    limit: 3,
  });

  const products = await stripe.products.list();

  return Response.json(
    prices.data.map((price) => {
      const product = products.data.find((p) => p.id === price.product);
      return {
        id: price.id,
        planName: product?.name ?? "Unknown Plan",
        currency: price.currency,
        price: price.unit_amount,
        recurring: price.recurring,
      };
    }),
  );
}
