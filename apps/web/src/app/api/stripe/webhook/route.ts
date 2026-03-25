import { db } from "@repo/database/index";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (error) {
    console.error("[/api/stripe/webhook] Error:", error);
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const stripeSubscriptionId = session.subscription as string;
      const userId = session.metadata?.userId as string;

      console.log("[/api/stripe/webhook] Event", event);
      console.log("[/api/stripe/webhook] Session:", session);

      try {
        const setSubscription = await db.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId,
          },
        });
        console.log(
          "[/api/stripe/webhook] Subscription updated:",
          setSubscription,
        );
      } catch (error) {
        console.error("[/api/stripe/webhook] Error:", error);
      }
      break;
    }

    default: {
      console.warn("[/api/stripe/webhook] Unhandled event type:", event.type);
      break;
    }
  }

  return new NextResponse("[/api/strip/webhook] Webhook processed", {
    status: 200,
  });
}
