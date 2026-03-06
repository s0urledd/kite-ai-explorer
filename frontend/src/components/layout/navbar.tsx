"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KiteLogo } from "@/components/common/kite-logo";
import { WalletModal } from "@/components/layout/wallet-modal";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/blocks", label: "Blockchain" },
  { href: "/tokens", label: "Tokens" },
  { href: "/contracts", label: "Contracts" },
  { href: "/stats", label: "Charts & Stats" },
  { href: "/api-docs", label: "API" },
];

export function Navbar() {
  const pathname = usePathname();
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-kite-bg/95 backdrop-blur-md border-b border-kite-border">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-14">
          {/* Left */}
          <div className="flex items-center gap-3">
            <KiteLogo size={26} />
            <span className="text-lg font-bold text-kite-text tracking-wide">Kite</span>
            <div className="flex gap-0.5 ml-4">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                      active
                        ? "text-kite-gold bg-kite-gold-faint"
                        : "text-kite-text-secondary hover:text-kite-gold hover:bg-kite-gold-faint"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kite-border bg-kite-surface text-kite-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
              <span className="text-xs">Mainnet</span>
            </div>
            <button
              onClick={() => setWalletOpen(true)}
              className="bg-kite-gold text-kite-bg px-4 py-2 rounded-[10px] font-semibold text-[13px] hover:bg-kite-gold-light hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(196,169,106,0.2)] transition-all"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} />}
    </>
  );
}
