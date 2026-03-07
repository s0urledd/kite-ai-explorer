"use client";

import { type ReactNode, lazy, Suspense } from "react";
import { ThemeProvider } from "@/lib/hooks/use-theme";

// Lazy-load the heavy wallet providers (RainbowKit + WagmiProvider + WalletConnect)
// This prevents 30s+ compile times on first page load in dev mode
const WalletProviders = lazy(() => import("./wallet-providers"));

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={children}>
        <WalletProviders>{children}</WalletProviders>
      </Suspense>
    </ThemeProvider>
  );
}
