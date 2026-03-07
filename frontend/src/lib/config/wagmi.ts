import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { kiteMainnet } from "./chain";

export const wagmiConfig = getDefaultConfig({
  appName: "Kite AI Explorer",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "kite-explorer-dev",
  chains: [kiteMainnet],
  ssr: true,
});
