"use client";

import { useEffect, useState } from "react";

export default function FaviconHandler() {
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((data) => {
        if (data.logoSekolah) {
          setLogoUrl(data.logoSekolah);
        }
      })
      .catch(() => {});
  }, []);

  // Update favicon using a link tag
  useEffect(() => {
    if (!logoUrl) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  }, [logoUrl]);

  return null;
}
