import type { GetStripeSubscriptionDetailsResponse } from "@repo/api/generated/api/types.gen";
import Link from "next/link";
import * as IconsSi from "rocketicons/si";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "@/lib/better-auth";
import CancelSubscriptionDialog from "./origin-ui/cancel-plan-dialog";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  user,
  subscription,
}: Readonly<{
  user: User;
  subscription?: GetStripeSubscriptionDetailsResponse | null;
}>) {
  const hasSubscription =
    !!user?.stripeSubscriptionId && !subscription?.cancel_at_period_end;
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="font-medium text-base">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link
              href="https://github.com/WilliamElesbao"
              target="_blank"
              className="dark:text-foreground"
            >
              <IconsSi.SiGithub className="size-5" />
            </Link>
          </Button>

          {hasSubscription && <CancelSubscriptionDialog />}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
