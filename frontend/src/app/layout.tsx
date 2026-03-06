import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Kite Explorer — KiteAI Block Explorer",
  description:
    "Explore blocks, transactions, addresses, and smart contracts on KiteAI Mainnet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-kite-bg text-kite-text font-sans antialiased">
        {/* TODO: Add Providers (RainbowKit, wagmi, ReactQuery) */}
        {/* TODO: Add Navbar component */}
        <main>{children}</main>
        {/* TODO: Add Footer component */}
      </body>
    </html>
  );
}
