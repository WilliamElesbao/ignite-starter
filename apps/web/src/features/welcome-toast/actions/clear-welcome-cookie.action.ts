"use server";

import { cookies } from "next/headers";
import { WELCOME_COOKIE } from "../constants/welcome-cookie";

export async function clearWelcomeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(WELCOME_COOKIE.key);
}
