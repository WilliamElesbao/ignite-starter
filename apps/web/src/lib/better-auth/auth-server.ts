import axios from "axios";
import { cookies } from "next/headers";

// TODO: Use SessionResponse type from the backend package
export interface SessionResponse {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    stripeSubscriptionId?: string | null;
  };
}

export async function getSession(): Promise<SessionResponse | null> {
  const cookieStore = await cookies();

  const { data } = await axios.get<SessionResponse>(
    `${process.env.API_URL}/auth/get-session`,
    {
      headers: { Cookie: cookieStore.toString() },
    },
  );

  return data;
}
