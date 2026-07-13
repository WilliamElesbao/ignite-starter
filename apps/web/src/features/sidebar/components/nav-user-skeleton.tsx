import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./sidebar";

export function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1 text-left">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
