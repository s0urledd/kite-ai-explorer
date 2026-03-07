import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/lib/hooks/use-theme";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
