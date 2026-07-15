import { Crossfade } from "@repo/ui/components/ui/crossfade";
import { Suspense } from "react";
import { SidebarInset } from "@/features/sidebar/components/sidebar";
import { PlanSection } from "./components/plan-section";
import { SiteHeader } from "./components/site-header";

export function SubscriptionPage() {
  return (
    <SidebarInset>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Suspense>
              <Crossfade>
                <PlanSection />
              </Crossfade>
            </Suspense>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
