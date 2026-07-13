import { Crossfade } from "@repo/ui/components/ui/crossfade";
import { IconRocket } from "@tabler/icons-react";
import { Suspense } from "react";
import { NavDocuments } from "@/features/sidebar/components/nav-documents";
import { NavMain } from "@/features/sidebar/components/nav-main";
import { NavSecondary } from "@/features/sidebar/components/nav-secondary";
import { NavUser } from "@/features/sidebar/components/nav-user";
import { NavUserSkeleton } from "@/features/sidebar/components/nav-user-skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/features/sidebar/components/sidebar";
import { Link } from "@/lib/i18n/navigation";
import { menu } from "./constants/constants";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <IconRocket className="size-5 text-primary" />
                <span className="font-semibold text-base">
                  <span className="text-primary">Next</span> Starter
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menu.navMain} />
        <NavDocuments items={menu.documents} />
        <NavSecondary items={menu.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <Crossfade>
            <NavUser />
          </Crossfade>
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
