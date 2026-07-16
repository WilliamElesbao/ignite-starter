import Stripe from "stripe";
import { env } from "../../env";

export const stripeClient = new Stripe(env.STRIPE_API_KEY, {
  apiVersion: "2026-06-24.dahlia",
});
