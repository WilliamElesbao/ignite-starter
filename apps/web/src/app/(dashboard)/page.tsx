import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/feature/dashboard/dashboard-wrapper";
import { getSession } from "@/lib/better-auth/auth-server";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) redirect("/sign-in");

  return <DashboardWrapper user={session.user} />;
}
