"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoRevealProps {
  logoSrc: string | null;
  schoolName: string;
  hasLogo: boolean;
}

// ─── Particle / floating piece that assembles into the logo ─────────────
function FloatingPieces({ count }: { count: number }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    // Random starting positions (spread out like a robot/figure)
    x: Math.random() * 300 - 150,
    y: Math.random() * 300 - 150,
    size: Math.random() * 24 + 8,
    rotate: Math.random() * 360,
    // Target position (converge to center)
    delay: i * 0.03,
    duration: 1.2 + Math.random() * 0.4,
  }));

  return (
    <>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-md"
          style={{
            width: p.size,
            height: p.size,
            background: `linear-gradient(${p.rotate}deg, 
              rgba(16,185,129,${0.4 + Math.random() * 0.4}), 
              rgba(20,184,166,${0.3 + Math.random() * 0.4}))`,
            border: "1px solid rgba(255,255,255,0.6)",
          }}
          initial={{
            x: p.x,
            y: p.y,
            rotate: p.rotate,
            scale: 1,
            opacity: 0,
          }}
          animate={{
            x: 0,
            y: 0,
            rotate: p.rotate + 180,
            scale: 0,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

// ─── Robot outline (SVG) ──────────────────────────────────────────────
function RobotFigure() {
  return (
    <motion.svg
      viewBox="0 0 200 240"
      className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.15, opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Head */}
      <motion.rect
        x="60" y="20" width="80" height="60" rx="16"
        fill="none" stroke="#059669" strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      {/* Eyes */}
      <motion.circle cx="80" cy="48" r="6" fill="#059669"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      <motion.circle cx="120" cy="48" r="6" fill="#059669"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
      {/* Eye glow */}
      <motion.circle cx="80" cy="48" r="10" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.5"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
      />
      <motion.circle cx="120" cy="48" r="10" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.5"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1.3 }}
      />
      {/* Antenna */}
      <motion.line x1="100" y1="20" x2="100" y2="5" stroke="#059669" strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <motion.circle cx="100" cy="3" r="4" fill="#10b981"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
      {/* Neck */}
      <motion.rect x="90" y="80" width="20" height="15" rx="4" fill="#059669" opacity="0.8"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
      {/* Body */}
      <motion.rect x="50" y="95" width="100" height="80" rx="12"
        fill="none" stroke="#059669" strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      />
      {/* Body detail - screen */}
      <motion.rect x="65" y="110" width="70" height="40" rx="8"
        fill="none" stroke="#14b8a6" strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 1.3 }}
      />
      {/* Screen dots */}
      {[
        { cx: 78, cy: 125, delay: 1.6 },
        { cx: 92, cy: 125, delay: 1.65 },
        { cx: 106, cy: 125, delay: 1.7 },
        { cx: 120, cy: 125, delay: 1.75 },
        { cx: 78, cy: 138, delay: 1.8 },
        { cx: 92, cy: 138, delay: 1.85 },
        { cx: 106, cy: 138, delay: 1.9 },
        { cx: 120, cy: 138, delay: 1.95 },
      ].map((dot, i) => (
        <motion.circle key={i} cx={dot.cx} cy={dot.cy} r="2.5" fill="#10b981"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 0.6] }}
          transition={{ duration: 0.3, delay: dot.delay }}
        />
      ))}
      {/* Left arm */}
      <motion.line x1="50" y1="105" x2="25" y2="140" stroke="#059669" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      />
      <motion.circle cx="25" cy="142" r="8" fill="none" stroke="#14b8a6" strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.6 }}
      />
      {/* Right arm */}
      <motion.line x1="150" y1="105" x2="175" y2="140" stroke="#059669" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 1.25 }}
      />
      <motion.circle cx="175" cy="142" r="8" fill="none" stroke="#14b8a6" strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.65 }}
      />
      {/* Legs */}
      <motion.line x1="75" y1="175" x2="70" y2="220" stroke="#059669" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 1.3 }}
      />
      <motion.line x1="125" y1="175" x2="130" y2="220" stroke="#059669" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 1.35 }}
      />
      {/* Feet */}
      <motion.ellipse cx="70" cy="225" rx="14" ry="6" fill="none" stroke="#14b8a6" strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.6 }}
      />
      <motion.ellipse cx="130" cy="225" rx="14" ry="6" fill="none" stroke="#14b8a6" strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.65 }}
      />
      {/* Heart glow */}
      <motion.circle cx="100" cy="135" r="3" fill="#f59e0b"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1, 1.2, 1], opacity: [0, 0.6, 0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 2 }}
      />
    </motion.svg>
  );
}

// ─── Main LogoReveal component ─────────────────────────────────────────
export default function LogoReveal({ logoSrc, schoolName, hasLogo }: LogoRevealProps) {
  const [phase, setPhase] = useState<"robot" | "transition" | "logo">("robot");

  useEffect(() => {
    // Robot shows for 2.5s, then transitions, then logo appears
    const t1 = setTimeout(() => setPhase("transition"), 2500);
    const t2 = setTimeout(() => setPhase("logo"), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="relative w-[280px] h-[340px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Phase 1: Robot */}
          {phase === "robot" && (
            <motion.div
              key="robot"
              className="absolute inset-0 flex items-center justify-center"
              exit="exit"
            >
              {/* Glow background */}
              <motion.div
                className="absolute w-48 h-48 rounded-full bg-emerald-400/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <RobotFigure />
              {/* Label */}
              <motion.p
                className="absolute bottom-2 text-sm font-semibold text-emerald-600/70 tracking-widest uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                Initializing...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 2: Transition (particles converge) */}
          {phase === "transition" && (
            <motion.div
              key="transition"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Central glow burst */}
              <motion.div
                className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 blur-2xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3, 0.5], opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <FloatingPieces count={20} />
            </motion.div>
          )}

          {/* Phase 3: Logo revealed */}
          {phase === "logo" && (
            <motion.div
              key="logo"
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Glow behind logo */}
              <motion.div
                className="absolute w-56 h-56 rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-200/20 to-emerald-400/20 blur-2xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />

              {hasLogo && logoSrc ? (
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/10 border-2 border-white/60 bg-white/90 p-4"
                  initial={{ scale: 0.3, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt={`Logo ${schoolName}`}
                    width={220}
                    height={220}
                    className="w-auto h-auto max-h-[200px] max-w-[200px] object-contain"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl flex items-center justify-center"
                  initial={{ scale: 0.3, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                >
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                  </svg>
                </motion.div>
              )}

              {/* School name below logo */}
              <motion.h2
                className="mt-6 text-2xl xl:text-3xl font-bold text-emerald-900 leading-tight text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {schoolName}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="mt-2 text-emerald-700/50 text-sm text-center px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Sistem Informasi Manajemen Sekolah
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature badges (always visible, fade in after logo) */}
      <motion.div
        className="mt-4 flex flex-wrap gap-2 justify-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === "logo" ? 1 : 0, y: phase === "logo" ? 0 : 20 }}
        transition={{ delay: phase === "logo" ? 0.8 : 0, duration: 0.5 }}
      >
        {["Data Siswa", "Data Guru", "Absensi", "Laporan"].map((feature, i) => (
          <motion.span
            key={feature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
          >
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            {feature}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
