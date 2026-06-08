"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/ui/sidebar";
import Link from "next/link";
import type * as React from "react";
import * as IconsGi from "rocketicons/gi";
import { data } from "@/constants";
import { NavDocuments } from "@/feature/dashboard/components/nav-documents";
import { NavMain } from "@/feature/dashboard/components/nav-main";
import { NavSecondary } from "@/feature/dashboard/components/nav-secondary";
import { NavUser } from "@/feature/dashboard/components/nav-user";
import type { User } from "@/lib/better-auth/auth.types";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="#">
                <IconsGi.GiFox className="!size-5 text-primary" />
                <span className="font-semibold text-base">
                  <span className="text-primary">Ignite </span>
                  Starter
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
