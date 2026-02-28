"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors />
    </ThemeProvider>
  );
}
