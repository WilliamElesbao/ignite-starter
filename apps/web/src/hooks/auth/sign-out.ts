"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";

export const signOut = async () => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[signOut]", error);
    throw error;
  }
};
