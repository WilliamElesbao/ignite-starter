"use client";

import { IconCirclePlusFilled } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/features/sidebar/components/sidebar";
import type { Menu } from "@/features/sidebar/constants/constants";
import { Link, usePathname } from "@/lib/i18n/navigation";

export function NavMain({ items }: Readonly<{ items: Menu["navMain"] }>) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavItem({ item }: Readonly<{ item: Menu["navMain"][number] }>) {
  const pathname = usePathname();

  const isSelected =
    pathname === item.url || pathname.startsWith(`${item.url}/`);

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton tooltip={item.title} isActive={isSelected} asChild>
        <Link href={item.url}>
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
