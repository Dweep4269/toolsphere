"use client";

import { useEffect } from "react";

export default function NavbarScrollHandler() {
  useEffect(() => {
    const navbar = document.getElementById("main-nav");
    if (!navbar) return;

    const handleScroll = () => {
      if (window.pageYOffset > 60) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
