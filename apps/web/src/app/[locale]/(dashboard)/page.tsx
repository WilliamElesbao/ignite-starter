import { redirect } from "next/navigation";
import { DashboardPage } from "@/features/dashboard";
import { getSession } from "@/lib/better-auth/auth-server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Dashboard({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/sign-in`);

  return <DashboardPage user={session.user} />;
}
