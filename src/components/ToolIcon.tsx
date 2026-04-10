"use client";
import { useState } from "react";
import Image from "next/image";

function getDomain(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  return name.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((token) => token[0]?.toUpperCase() || "").join("") || "AI";
}

export default function ToolIcon({ name, url, iconUrl, size = 48 }: { name: string; url?: string; iconUrl?: string | null; size?: number }) {
  const [error, setError] = useState(false);
  const domain = url ? getDomain(url) : "";

  if (!domain || error) {
    const hue = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
    return (
      <div 
        style={{ 
          width: size, height: size, 
          backgroundColor: `hsl(${hue}, 45%, 32%)`,
          color: "#f7efe3",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "8px", fontWeight: "bold", fontSize: `${size * 0.4}px`, flexShrink: 0
        }}
        aria-hidden="true"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <Image 
      src={`https://logo.clearbit.com/${domain}?size=${size * 2}`} 
      alt={`${name} logo`}
      width={size}
      height={size}
      style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0, backgroundColor: "white" }}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
