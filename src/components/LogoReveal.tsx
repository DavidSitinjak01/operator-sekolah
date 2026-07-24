"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LogoRevealProps {
  logoSrc: string | null;
  schoolName: string;
  hasLogo: boolean;
}

// ─── Main LogoReveal component (lightweight) ──────────────────────────
export default function LogoReveal({
  logoSrc,
  schoolName,
  hasLogo,
}: LogoRevealProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay for initial paint, then animate in
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[420px]">

      {/* ── Subtle floating particles (only 8, not 15+) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 22}%`,
              backgroundColor:
                i % 2 === 0
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(52,211,153,0.2)",
            }}
            animate={{
              y: [0, -(6 + i * 2), 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* ── Glow behind logo ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 240,
          background:
            "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.06) 50%, transparent 70%)",
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={mounted ? { scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Logo ── */}
      <motion.div
        className="relative rounded-2xl overflow-hidden border-2 bg-white shadow-xl z-10"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ borderColor: "rgba(16,185,129,0.2)" }}
      >
        <div className="p-4">
          {hasLogo && logoSrc ? (
            <img
              src={logoSrc}
              alt={`Logo ${schoolName}`}
              width={160}
              height={160}
              className="w-auto h-auto max-h-[150px] max-w-[150px] object-contain"
            />
          ) : (
            <div className="w-[150px] h-[150px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Subtle animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "0 0 20px rgba(16,185,129,0.1), inset 0 0 20px rgba(16,185,129,0.05)",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* ── School name ── */}
      <motion.h2
        className="mt-5 text-2xl xl:text-3xl font-bold text-emerald-900 leading-tight text-center px-4 relative z-10"
        initial={{ opacity: 0, y: 15 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {schoolName}
      </motion.h2>

      {/* ── Subtitle ── */}
      <motion.p
        className="mt-2 text-emerald-700/50 text-sm text-center px-4 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        Sistem Informasi Manajemen Sekolah
      </motion.p>

      {/* ── Feature badges ── */}
      <motion.div
        className="mt-4 flex flex-wrap gap-2 justify-center px-4 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {["Data Siswa", "Data Guru", "Absensi", "Laporan"].map(
          (feature, i) => (
            <span
              key={feature}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
              style={{ animationDelay: `${0.4 + i * 0.08}s` }}
            >
              <svg
                className="w-3 h-3 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
              {feature}
            </span>
          )
        )}
      </motion.div>
    </div>
  );
}
