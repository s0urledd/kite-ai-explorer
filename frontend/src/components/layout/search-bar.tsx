"use client";

export function SearchBar() {
  return (
    <div className="relative py-7 px-6 bg-gradient-to-b from-[#110F0A] to-kite-bg overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[120px] bg-[radial-gradient(ellipse,rgba(196,169,106,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex items-center gap-2.5 max-w-[680px] mx-auto px-4 py-2.5 bg-kite-surface border border-kite-border rounded-[14px]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-kite-text-muted flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="flex-1 bg-transparent border-none outline-none text-kite-text text-sm placeholder:text-kite-text-muted"
          placeholder="Search by address, tx hash, block number, token..."
        />
        <kbd className="text-kite-text-muted text-xs font-mono border border-kite-border rounded px-1.5 py-px leading-[18px]">
          /
        </kbd>
      </div>
    </div>
  );
}
