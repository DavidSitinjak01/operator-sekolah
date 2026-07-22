"use client";

import { useEffect } from "react";

export default function FaviconHandler() {
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/pengaturan");
        const data = await res.json();

        if (!res.ok) return;

        // ─── Set Favicon ──────────────────────────────────────────
        // Use /icon route which now reads from Pengaturan.logoSekolah first
        const cacheBuster = `t=${Date.now()}`;

        let link = document.querySelector(
          'link[rel="icon"]'
        ) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.type = "image/x-icon";
        link.href = `/icon?${cacheBuster}`;

        // Also set apple-touch-icon for iOS home screen
        let appleLink = document.querySelector(
          'link[rel="apple-touch-icon"]'
        ) as HTMLLinkElement | null;
        if (!appleLink) {
          appleLink = document.createElement("link");
          appleLink.rel = "apple-touch-icon";
          document.head.appendChild(appleLink);
        }
        appleLink.href = `/icon?${cacheBuster}`;

        // ─── Set Document Title ──────────────────────────────────
        const namaSekolah = data.namaSekolah || "Operator Sekolah";
        document.title = namaSekolah;
      } catch {
        // Silently fail — use defaults
      }
    };

    loadSettings();
  }, []);

  return null;
}
