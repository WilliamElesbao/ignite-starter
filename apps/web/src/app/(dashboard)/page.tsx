import { getSession } from "@/lib/better-auth/auth-server";
import { DashboardWrapper } from "./dashboard-wrapper";

export default async function Page() {
  const session = await getSession();

  return <DashboardWrapper user={session?.user} />;
}
