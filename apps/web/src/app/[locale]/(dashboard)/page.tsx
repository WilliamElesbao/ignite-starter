import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/feature/dashboard/dashboard-wrapper";
import { getSession } from "@/lib/better-auth/auth-server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/sign-in`);

  return <DashboardWrapper user={session.user} />;
}
