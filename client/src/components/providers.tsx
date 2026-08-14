"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@teispace/next-themes";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/contexts/auth-context";
import { I18nProvider } from "@/contexts/i18n-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <MotionConfig reducedMotion="user">
                <I18nProvider>{children}</I18nProvider>
              </MotionConfig>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
    </ThemeProvider>
  );
}
