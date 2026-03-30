"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { ChoosePlanDialog } from "@/components/origin-ui/choose-plan-dialog";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DialogProvider } from "@/context/dialog.context";
import { useWelcomeToast } from "@/feature/auth/hooks";
import {
  useGetStripeProducts,
  useGetStripeSubscriptionDetails,
} from "@/hooks/stripe/stripe.queries";
import type { User } from "@/lib/better-auth";
import data from "./data.json";

interface DashboardWrapperProps {
  user: User;
}

export function DashboardWrapper({ user }: DashboardWrapperProps) {
  const { data: products } = useGetStripeProducts();
  const { data: subscription } = useGetStripeSubscriptionDetails();

  useWelcomeToast();

  return (
    <DialogProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader user={user} subscription={subscription} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>

        <ChoosePlanDialog
          user={user}
          subscription={subscription}
          products={products}
        />
      </SidebarProvider>
    </DialogProvider>
  );
}
