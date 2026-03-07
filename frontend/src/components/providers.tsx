"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/config/wagmi";
import { ThemeProvider, useTheme } from "@/lib/hooks/use-theme";

const queryClient = new QueryClient();

function RainbowKitWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const rkTheme = theme === "dark"
    ? darkTheme({
        accentColor: "#C4A96A",
        accentColorForeground: "#09090B",
        borderRadius: "medium",
        fontStack: "system",
      })
    : lightTheme({
        accentColor: "#9A7B3C",
        accentColorForeground: "#FFFFFF",
        borderRadius: "medium",
        fontStack: "system",
      });

  return (
    <RainbowKitProvider theme={rkTheme} modalSize="compact">
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitWrapper>
            {children}
          </RainbowKitWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
