import { db, Role, Status } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    fields: {
      name: "name",
      email: "email",
      image: "image",
      surname: "surname",
    },
    additionalFields: {
      surname: { type: "string", required: true },
      role: {
        type: "string",
        required: true,
        default: Role.DEFAULT,
        input: false,
      },
      status: {
        type: "string",
        required: true,
        default: Status.AUTHORIZED,
        input: false,
      },
      stripeSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "select_account",
      mapProfileToUser: (profile) => ({
        name: profile.given_name,
        surname: profile.family_name,
        email: profile.email,
        image: profile.picture,
      }),
    },
  },
  plugins: [nextCookies()],
  /** if no database is provided, the user data will be stored in memory.
   * Make sure to provide a database to persist user data **/
});
