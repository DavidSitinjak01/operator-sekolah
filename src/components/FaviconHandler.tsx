"use client";

import { useEffect } from "react";

export default function FaviconHandler() {
  useEffect(() => {
    // Always use /icon route which dynamically serves the school logo
    // from IdentitasSekolah table (works with both local dev and Vercel)
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      document.head.appendChild(link);
    }
    // Use current timestamp to bust cache when logo changes
    link.href = `/icon?t=${Date.now()}`;
  }, []);

  return null;
}
