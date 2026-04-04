import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NavbarScrollHandler from "@/components/NavbarScrollHandler";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ToolSphere — Discover the Right AI Tool",
  description:
    "Navigate the AI landscape with clarity. Discover AI tools, MCPs, agent skills, agentic IDEs, and more. Compare alternatives and make informed decisions.",
  keywords: [
    "AI tools",
    "MCP servers",
    "agent skills",
    "agentic IDE",
    "AI benchmarks",
    "AI directory",
  ],
  openGraph: {
    title: "ToolSphere — Discover the Right AI Tool",
    description:
      "Navigate the AI landscape with clarity. Discover AI tools, MCPs, agent skills, and more.",
    type: "website",
    siteName: "ToolSphere",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Fraunces is loaded via Google Fonts link since next/font doesn't support variable optical sizing well */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
        <div className="grain-overlay" aria-hidden="true" />
        <NavbarScrollHandler />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
