"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/tools", label: "Tools" },
  { href: "/categories", label: "Categories" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/news", label: "News" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop links */}
      {NAV_ITEMS.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={`nav-link ${pathname.startsWith(link.href) ? "nav-link--active" : ""}`}
        >
          {link.label}
        </Link>
      ))}

      {/* Mobile hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay + panel */}
      {mobileOpen && (
        <>
          <div
            className="nav-mobile-overlay"
            style={{ display: "block" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="nav-mobile-panel">
            <button
              className="nav-mobile-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {NAV_ITEMS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`nav-mobile-link ${pathname.startsWith(link.href) ? "nav-mobile-link--active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
