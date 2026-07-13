"use client";

import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/features/dashboard/components/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getQueryClient } from "@/lib/react-query/query-client";

function ToasterWithPosition() {
  const isMobile = useIsMobile();

  return (
    <Toaster richColors position={isMobile ? "top-center" : "bottom-right"} />
  );
}

export function Providers({ children }: Readonly<PropsWithChildren>) {
  const client = getQueryClient();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <TooltipProvider>
          {children}
          <ToasterWithPosition />
        </TooltipProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
