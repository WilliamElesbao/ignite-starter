import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";
import { DashboardWrapper } from "./dashboard-wrapper";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <DashboardWrapper user={session?.user} />;
}
