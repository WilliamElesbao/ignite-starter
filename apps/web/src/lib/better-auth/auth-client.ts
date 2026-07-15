import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.API_URL || "http://localhost:3333",
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
