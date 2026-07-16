import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { IconBrandGithub } from "@tabler/icons-react";
import { SidebarTrigger } from "@/features/sidebar/components/sidebar";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "../../../components/language-switcher";
import { ThemeToggle } from "../../../components/theme-toggle";
import { SendEmailButton } from "./send-email-button";
import { UserPlanBadge } from "./user-plan-badge";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 my-auto data-[orientation=vertical]:h-4"
        />
        <h1 className="font-medium text-base">Subscription</h1>
        <div className="ml-auto flex items-center gap-2">
          <UserPlanBadge />
          <SendEmailButton />
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link
              href="https://github.com/WilliamElesbao"
              target="_blank"
              className="dark:text-foreground"
            >
              <IconBrandGithub className="size-5" />
            </Link>
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
