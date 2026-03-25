import { type NextRequest, NextResponse } from "next/server";
import dayjs from "@/lib/dayjs";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { stripeSubscriptionId } = await request.json();

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Missing stripeSubscriptionId" },
        { status: 400 },
      );
    }

    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const priceId = subscription.items.data[0]?.price?.id;
    const productId = subscription.items.data[0]?.price?.product as string;

    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(productId);

    const current_period_start = dayjs.unix(
      subscription.items.data[0].current_period_start,
    );
    const current_period_end = dayjs.unix(
      subscription.items.data[0].current_period_end,
    );
    console.log(current_period_start, current_period_end);

    return NextResponse.json({
      // subscription: {
      id: subscription.id,
      status: subscription.status,
      current_period_start,
      current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      customer: subscription.customer,
      created: subscription.created,
      plan: {
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
      // },
    });
  } catch (error) {
    console.error("[/api/stripe/subscription-details] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 },
    );
  }
}
