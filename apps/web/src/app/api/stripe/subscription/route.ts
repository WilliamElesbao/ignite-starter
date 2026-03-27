import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/better-auth/auth-server";
import dayjs from "@/lib/dayjs";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  // console.log("[POST /api/stripe/subscription] data:", data);
  // console.log("[POST /api/stripe/subscription] user:", session?.user);
  const priceId = data.priceId;
  const planName = data.planName;

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: "http://localhost:3000",
      cancel_url: "http://localhost:3000",
      customer_email: session?.user.email,

      metadata: {
        userId: session?.user?.id,
        planName: planName,
      },
    });
    return Response.json({ url: stripeSession.url });
  } catch (error) {
    console.error(
      "[POST /api/stripe/subscription] Error creating session:",
      error,
    );
    return Response.json(
      { error: "Failed to create subscription session." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await request.json();
  console.log("[/api/subscription/update] data:", data);
  const priceId = data.priceId;
  const planName = data.planName;

  // const subscription = await db.user.findUnique({
  //   where: { id: session.user.id },
  // });

  const [subscription] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));

  if (!subscription?.stripeSubscriptionId) {
    return new Response("Subscription not found", { status: 404 });
  }

  try {
    const currentSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    console.log(
      "[/api/subscription/update] Current Subscription:",
      currentSubscription,
    );

    const updated = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations", // ou 'none', 'always_invoice'

        metadata: {
          userId: session?.user?.id,
          planName: planName,
        },
      },
    );
    console.log("[/api/subscription/update] Updated Subscription:", updated);

    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     stripeSubscriptionId: updated.id,
    //     updatedAt: dayjs().toDate(),
    //   },
    // });
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        stripeSubscriptionId: updated.id,
        updatedAt: dayjs().toDate(),
      })
      .where(eq(schema.users.id, session.user.id))
      .returning();
    console.log("[/api/subscription/update] Updated User:", updatedUser);

    return Response.json({ updated });
  } catch (error) {
    console.error(
      "[/api/subscription/update] Error updating subscription:",
      error,
    );
    return Response.json(
      { error: "Failed to update subscription." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getSession();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // const subscription = await db.user.findUnique({
  //   where: { id: session.user.id },
  // });
  const [subscription] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));

  if (!subscription?.stripeSubscriptionId) {
    return new Response("Subscription not found", { status: 404 });
  }

  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     updatedAt: dayjs().toDate(),
    //   },
    // });
    const [updatedUser] = await db
      .update(schema.users)
      .set({ updatedAt: dayjs().toDate() })
      .where(eq(schema.users.id, session.user.id))
      .returning();
    console.log("[/api/subscription/update] Updated User:", updatedUser);

    return new Response("Subscription canceled successfully", { status: 200 });
  } catch (error) {
    console.error(
      "[/api/stripe/subscription] Error canceling subscription:",
      error,
    );
    return new Response("Failed to cancel subscription", { status: 500 });
  }
}
