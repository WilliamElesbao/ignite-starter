"use server";

import type { Session, User } from "@repo/api/generated/api/types.gen";
import { cookies } from "next/headers";
import z from "zod";
import { logger } from "@/utils/logger";
import { safeFetch } from "@/utils/safe-fetch";

type GetSessionResponse = { session: Session; user: User } | null;

const sessionSchema: z.ZodType<GetSessionResponse> = z
  .object({
    session: z.object({
      id: z.string(),
      expiresAt: z.string(),
      token: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      userId: z.string(),
    }),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      image: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      stripeCustomerId: z.string().optional(),
    }),
  })
  .nullable();

type SessionResponse = z.infer<typeof sessionSchema>;

export async function getSessionAction(): Promise<SessionResponse> {
  "use cache: private";

  const cookieStore = await cookies();

  const result = await safeFetch(
    `${process.env.API_URL}/auth/get-session`,
    sessionSchema,
    {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  );

  if (!result.success) {
    logger.error("Fetch error:", result.error);
    return null;
  }

  logger.info("Session data:", result.data);
  return result.data;
}
