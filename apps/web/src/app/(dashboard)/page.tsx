import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth";
import { DashboardWrapper } from "./dashboard-wrapper";

export default async function Page() {
  const session = await getSession();

  if (!session) redirect("/login");

  return <DashboardWrapper user={session.user} />;
}
