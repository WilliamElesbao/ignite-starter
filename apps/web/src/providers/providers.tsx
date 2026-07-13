"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/features/dashboard/components/sonner";
import { getQueryClient } from "@/lib/react-query/query-client";

export function Providers({ children }: PropsWithChildren) {
  const client = getQueryClient();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
