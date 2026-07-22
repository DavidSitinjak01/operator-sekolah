"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoRevealProps {
  logoSrc: string | null;
  schoolName: string;
  hasLogo: boolean;
}

// ─── Single debris/shard fragment ────────────────────────────────────
function DebrisPiece({
  index,
  total,
  onComplete,
}: {
  index: number;
  total: number;
  onComplete: () => void;
}) {
  const angle = (index / total) * Math.PI * 2;
  // Scatter distance: far away initially
  const scatterRadius = 180 + Math.random() * 120;
  const startX = Math.cos(angle) * scatterRadius;
  const startY = Math.sin(angle) * scatterRadius;
  const startRotate = Math.random() * 720 - 360;
  const startScale = 0.3 + Math.random() * 0.7;

  // Random delay based on distance from center (closer pieces arrive first)
  const delay = 0.3 + (scatterRadius / 300) * 1.2 + Math.random() * 0.3;
  const duration = 1.0 + Math.random() * 0.5;

  // Random shard shape
  const isRect = index % 3 === 0;
  const isTri = index % 3 === 1;
  const size = 4 + Math.random() * 10;
  const opacity = 0.4 + Math.random() * 0.6;

  // Color: mix of emerald, teal, and some amber sparks
  const colors = [
    "rgba(16,185,129,VAR)",
    "rgba(20,184,166,VAR)",
    "rgba(52,211,153,VAR)",
    "rgba(45,212,191,VAR)",
    "rgba(245,158,11,VAR)", // amber sparks
    "rgba(14,165,233,VAR)", // blue sparks
  ];
  const colorTemplate = colors[index % colors.length];
  const color = colorTemplate.replace("VAR", String(opacity));

  return (
    <motion.div
      className="absolute"
      style={{
        width: size,
        height: isRect ? size * (1.5 + Math.random()) : size,
        backgroundColor: color,
        borderRadius: isTri ? "2px" : `${Math.random() * 4}px`,
        transform: isTri ? "rotate(45deg)" : undefined,
        boxShadow: `0 0 ${size * 0.5}px ${color}`,
      }}
      initial={{
        x: startX,
        y: startY,
        rotate: startRotate,
        scale: startScale,
        opacity: 0,
      }}
      animate={{
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        rotate: startRotate + 360 * (Math.random() > 0.5 ? 1 : -1),
        scale: 0,
        opacity: [0, opacity, opacity, 0],
      }}
      transition={{
        x: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] },
        y: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] },
        rotate: { duration, delay, ease: "easeInOut" },
        scale: { duration: duration * 0.5, delay: delay + duration * 0.5, ease: "easeIn" },
        opacity: { duration, delay, times: [0, 0.1, 0.8, 1] },
      }}
      onAnimationComplete={onComplete}
    />
  );
}

// ─── Blue flame aura around the logo ──────────────────────────────────
function BlueFlameAura() {
  // Multiple flame layers for realistic effect
  const flames = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 360;
      arr.push({
        id: i,
        angle,
        delay: i * 0.15,
        size: 60 + Math.random() * 40,
        duration: 1.5 + Math.random() * 1,
        startX: Math.cos((angle * Math.PI) / 180) * 70,
        startY: Math.sin((angle * Math.PI) / 180) * 70,
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          left: "50%",
          top: "50%",
          marginLeft: -120,
          marginTop: -120,
          background:
            "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.15) 30%, rgba(29,78,216,0.05) 60%, transparent 70%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 0.95, 1.1, 1],
          opacity: [0, 0.8, 1, 0.9, 0.7],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Flame particles orbiting */}
      {flames.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            width: 12 + Math.random() * 10,
            height: 12 + Math.random() * 14,
            left: "50%",
            top: "50%",
            background: `radial-gradient(ellipse, rgba(96,165,250,0.7) 0%, rgba(59,130,246,0.3) 50%, transparent 70%)`,
            filter: "blur(3px)",
          }}
          initial={{
            x: f.startX * 0.5,
            y: f.startY * 0.5,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: [f.startX * 0.5, f.startX * 1.2, f.startX * 0.3, f.startX],
            y: [f.startY * 0.5, f.startY * -0.8, f.startY * 0.5, f.startY],
            scale: [0, 1.2, 0.8, 0.3],
            opacity: [0, 0.6, 0.5, 0],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Rising blue embers */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            left: `${35 + Math.random() * 30}%`,
            bottom: "30%",
            background: "rgba(147,197,253,0.8)",
            boxShadow: "0 0 6px rgba(96,165,250,0.6)",
            filter: "blur(1px)",
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: -(40 + Math.random() * 60),
            x: (Math.random() - 0.5) * 30,
            opacity: [0, 0.8, 0.4, 0],
            scale: [0, 1, 0.8, 0],
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.8,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Inner intense glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          left: "50%",
          top: "50%",
          marginLeft: -90,
          marginTop: -90,
          border: "2px solid rgba(96,165,250,0.15)",
          boxShadow:
            "0 0 20px rgba(59,130,246,0.2), inset 0 0 20px rgba(59,130,246,0.1)",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0, 0.6, 0.4],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Dust / floating particles in background ───────────────────────────
function BackgroundDust() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full bg-emerald-400/20"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            y: -(10 + Math.random() * 20),
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main LogoReveal component ─────────────────────────────────────────
export default function LogoReveal({ logoSrc, schoolName, hasLogo }: LogoRevealProps) {
  const [phase, setPhase] = useState<"debris" | "assembled" | "flame">("debris");
  const DEBRIS_COUNT = 50;

  useEffect(() => {
    // Debris assembles for ~2.5s, then logo appears, then flame
    const t1 = setTimeout(() => setPhase("assembled"), 2800);
    const t2 = setTimeout(() => setPhase("flame"), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[400px]">
      {/* Background dust */}
      <BackgroundDust />

      {/* Debris particles */}
      <AnimatePresence>
        {phase === "debris" && (
          <motion.div
            key="debris"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Central convergence point glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 160,
                height: 160,
                left: "50%",
                top: "50%",
                marginLeft: -80,
                marginTop: -80,
                background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
              }}
              animate={{
                scale: [0.8, 1.2, 1],
                opacity: [0.3, 0.7, 0.9],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {Array.from({ length: DEBRIS_COUNT }, (_, i) => (
              <DebrisPiece
                key={i}
                index={i}
                total={DEBRIS_COUNT}
                onComplete={() => {}}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assembled logo + name */}
      <AnimatePresence>
        {(phase === "assembled" || phase === "flame") && (
          <motion.div
            key="assembled"
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.7, filter: "brightness(2) blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Flash effect on assembly */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(96,165,250,0.3) 40%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Logo container */}
            <div className="relative">
              {/* Blue flame aura (only after fully assembled) */}
              <AnimatePresence>
                {phase === "flame" && (
                  <motion.div
                    key="flame-aura"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -inset-16"
                  >
                    <BlueFlameAura />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logo image */}
              {hasLogo && logoSrc ? (
                <motion.div
                  className="relative rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-white/90 p-3 z-10"
                  initial={{ y: 0 }}
                  animate={phase === "flame" ? { y: -2 } : { y: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt={`Logo ${schoolName}`}
                    width={180}
                    height={180}
                    className="w-auto h-auto max-h-[170px] max-w-[170px] object-contain"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl flex items-center justify-center z-10"
                  initial={{ y: 0 }}
                  animate={phase === "flame" ? { y: -2 } : { y: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* School name */}
            <motion.h2
              className="mt-6 text-2xl xl:text-3xl font-bold text-emerald-900 leading-tight text-center px-4 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {schoolName}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="mt-2 text-emerald-700/50 text-sm text-center px-4 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Sistem Informasi Manajemen Sekolah
            </motion.p>

            {/* Feature badges */}
            <motion.div
              className="mt-5 flex flex-wrap gap-2 justify-center px-4 relative z-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {["Data Siswa", "Data Guru", "Absensi", "Laporan"].map((feature, i) => (
                <motion.span
                  key={feature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.3 }}
                >
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  {feature}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
