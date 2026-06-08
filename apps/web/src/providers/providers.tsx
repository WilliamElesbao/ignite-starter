"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/feature/dashboard/components/sonner";
import { queryClient } from "@/lib/react-query";

export function Providers({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
