import Link from "next/link";
import prisma from "@/lib/db";
import NavLinks from "@/components/NavLinks";

export default async function Navbar() {
  let toolCount = 0;
  try {
    toolCount = await prisma.tool.count();
  } catch {
    // Graceful fallback for build time without DB
    toolCount = 832;
  }

  return (
    <nav className="navbar" id="main-nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" id="nav-logo">
          <svg
            className="logo-icon"
            viewBox="0 0 36 36"
            width="30"
            height="30"
            fill="none"
            stroke="#C8A87C"
            strokeWidth="1.2"
          >
            <circle cx="18" cy="18" r="14" />
            <ellipse cx="18" cy="18" rx="8" ry="14" />
            <ellipse
              cx="18"
              cy="18"
              rx="14"
              ry="8"
              transform="rotate(90 18 18)"
            />
            <line x1="4" y1="18" x2="32" y2="18" strokeOpacity="0.5" />
            <path d="M6 10 Q18 12 30 10" strokeOpacity="0.4" />
            <path d="M6 26 Q18 24 30 26" strokeOpacity="0.4" />
          </svg>
          <span className="logo-text">ToolSphere</span>
        </Link>

        <div className="nav-links" id="nav-links">
          <NavLinks />
        </div>

        <div className="nav-right">
          <span className="nav-stat">
            <strong>{toolCount}</strong> tools indexed
          </span>
          <Link href="/tools" className="nav-cta" id="browse-tools-btn">
            Browse Tools
          </Link>
        </div>
      </div>
    </nav>
  );
}
