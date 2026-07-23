"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoRevealProps {
  logoSrc: string | null;
  schoolName: string;
  hasLogo: boolean;
}

// ─── Single tile/piece of the logo image ─────────────────────────────
function LogoTile({
  row,
  col,
  totalRows,
  totalCols,
  logoSrc,
  tileWidth,
  tileHeight,
  index,
  totalCount,
  delay: userDelay,
}: {
  row: number;
  col: number;
  totalRows: number;
  totalCols: number;
  logoSrc: string;
  tileWidth: number;
  tileHeight: number;
  index: number;
  totalCount: number;
  delay: number;
}) {
  // Where this tile should end up (final grid position)
  const targetX = col * tileWidth;
  const targetY = row * tileHeight;

  // Random scattered start position (far from center)
  const angle = (index / totalCount) * Math.PI * 2 + Math.random() * 0.5;
  const scatterDist = 200 + Math.random() * 250;
  const startX = Math.cos(angle) * scatterDist;
  const startY = Math.sin(angle) * scatterDist;
  const startRotate = (Math.random() - 0.5) * 360;
  const startScale = 0.5 + Math.random() * 0.5;

  // Stagger delay: pieces assemble in a spiral/inward pattern
  const distFromCenter = Math.sqrt(
    Math.pow(col - totalCols / 2, 2) + Math.pow(row - totalRows / 2, 2)
  );
  const maxDist = Math.sqrt(
    Math.pow(totalCols / 2, 2) + Math.pow(totalRows / 2, 2)
  );
  const normalizedDist = distFromCenter / maxDist;
  // Inner pieces arrive first, outer pieces later — creating an inward assembly
  const stagger = normalizedDist * 1.2 + Math.random() * 0.2;
  const totalDelay = 0.3 + stagger + userDelay;

  const animDuration = 1.0 + Math.random() * 0.3;

  // Slight glow on each tile while flying
  const glowColor =
    index % 3 === 0
      ? "rgba(59,130,246,0.5)"
      : index % 3 === 1
        ? "rgba(16,185,129,0.4)"
        : "rgba(45,212,191,0.4)";

  return (
    <motion.div
      className="absolute overflow-hidden"
      style={{
        width: tileWidth,
        height: tileHeight,
        left: "50%",
        top: "50%",
        backgroundImage: `url(${logoSrc})`,
        backgroundSize: `${tileWidth * totalCols}px ${tileHeight * totalRows}px`,
        backgroundPosition: `-${col * tileWidth}px -${row * tileHeight}px`,
        borderRadius: "2px",
      }}
      initial={{
        x: startX - tileWidth / 2,
        y: startY - tileHeight / 2,
        rotate: startRotate,
        scale: startScale,
        opacity: 0,
        boxShadow: `0 0 12px ${glowColor}`,
      }}
      animate={{
        x: targetX - (tileWidth * totalCols) / 2 + tileWidth / 2,
        y: targetY - (tileHeight * totalRows) / 2 + tileHeight / 2,
        rotate: 0,
        scale: 1,
        opacity: 1,
        boxShadow: "0 0 0px transparent",
      }}
      transition={{
        x: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        y: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        rotate: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        scale: {
          duration: animDuration * 0.8,
          delay: totalDelay,
          ease: "easeOut",
        },
        opacity: {
          duration: 0.3,
          delay: totalDelay,
        },
      }}
    />
  );
}

// ─── Blue fire / flame effect ─────────────────────────────────────────
function BlueFireEffect() {
  const flames = useMemo(() => {
    const arr = [];
    // Larger, more visible flame tongues
    for (let i = 0; i < 24; i++) {
      arr.push({
        id: i,
        angle: (i / 24) * 360,
        delay: i * 0.1,
        size: 35 + Math.random() * 50,
        duration: 2.0 + Math.random() * 1.5,
        orbitRadius: 95 + Math.random() * 25,
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Large outer blue glow aura — very visible */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          left: "50%",
          top: "50%",
          marginLeft: -160,
          marginTop: -160,
          background:
            "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.2) 30%, rgba(29,78,216,0.08) 50%, transparent 65%)",
          filter: "blur(4px)",
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 0.92, 1.1, 1],
          opacity: [0, 0.8, 1, 0.9, 0.8],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary pulsing glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          left: "50%",
          top: "50%",
          marginLeft: -130,
          marginTop: -130,
          background:
            "radial-gradient(circle, transparent 40%, rgba(96,165,250,0.12) 55%, rgba(59,130,246,0.06) 70%, transparent 85%)",
          filter: "blur(2px)",
        }}
        initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
        animate={{
          scale: [1, 1.2, 0.9, 1.15, 1],
          opacity: [0, 0.6, 0.9, 0.7, 0.6],
          rotate: [0, 5, -3, 4, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blue flame tongues — larger and brighter */}
      {flames.map((f) => {
        const rad = (f.angle * Math.PI) / 180;
        const cx = Math.cos(rad) * f.orbitRadius;
        const cy = Math.sin(rad) * f.orbitRadius;

        return (
          <motion.div
            key={f.id}
            className="absolute"
            style={{
              width: f.size * 0.6,
              height: f.size,
              left: "50%",
              top: "50%",
              marginLeft: -(f.size * 0.6) / 2,
              marginTop: -f.size / 2,
              background:
                "linear-gradient(to top, rgba(37,99,235,0.8) 0%, rgba(59,130,246,0.6) 25%, rgba(96,165,250,0.35) 50%, rgba(147,197,253,0.15) 75%, transparent 100%)",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              filter: "blur(2px)",
              transformOrigin: "center bottom",
              boxShadow: "0 0 8px rgba(59,130,246,0.3)",
            }}
            initial={{
              x: cx,
              y: cy,
              scale: 0,
              opacity: 0,
              rotate: f.angle + 90,
            }}
            animate={{
              x: [cx, cx * 1.2, cx * 0.85, cx],
              y: [cy, cy * -1.2, cy * 0.8, cy],
              scale: [0, 1.3, 0.8, 0.15],
              opacity: [0, 0.7, 0.5, 0],
              rotate: f.angle + 90 + (Math.random() > 0.5 ? 10 : -10),
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Inner bright blue ring glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          left: "50%",
          top: "50%",
          marginLeft: -100,
          marginTop: -100,
          border: "2px solid rgba(96,165,250,0.35)",
          boxShadow:
            "0 0 35px rgba(59,130,246,0.4), 0 0 70px rgba(59,130,246,0.15), inset 0 0 35px rgba(59,130,246,0.15)",
        }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0, 0.7, 0.55],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bright rising blue sparks / embers — bigger and brighter */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            left: `${25 + Math.random() * 50}%`,
            top: `${30 + Math.random() * 40}%`,
            background: `rgba(147,197,253,${0.7 + Math.random() * 0.3})`,
            boxShadow: "0 0 10px rgba(96,165,250,0.8), 0 0 20px rgba(59,130,246,0.4)",
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: -(40 + Math.random() * 90),
            x: (Math.random() - 0.5) * 50,
            opacity: [0, 1, 0.7, 0],
            scale: [0, 1.5, 1, 0],
          }}
          transition={{
            duration: 1.8 + Math.random() * 1.2,
            delay: i * 0.12 + Math.random() * 0.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating ambient particles ───────────────────────────────────────
function AmbientParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`ambient-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor:
              i % 2 === 0
                ? "rgba(96,165,250,0.25)"
                : "rgba(16,185,129,0.2)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            y: -(8 + Math.random() * 15),
            x: (Math.random() - 0.5) * 10,
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Central convergence glow during assembly ────────────────────────
function ConvergenceGlow({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 160,
        height: 160,
        left: "50%",
        top: "50%",
        marginLeft: -80,
        marginTop: -80,
        background:
          "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.08) 40%, transparent 70%)",
        filter: "blur(1px)",
      }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{
        scale: [0.8, 1.3, 1],
        opacity: [0.2, 0.6, 0.8],
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Main LogoReveal component ─────────────────────────────────────────
export default function LogoReveal({
  logoSrc,
  schoolName,
  hasLogo,
}: LogoRevealProps) {
  const [phase, setPhase] = useState<"assembling" | "assembled" | "flame">(
    "assembling"
  );
  // Grid dimensions for splitting the logo into tiles
  const COLS = 8;
  const ROWS = 8;
  const TILE_SIZE = 22; // px per tile (logo ~176px)
  const TOTAL_TILES = COLS * ROWS;

  useEffect(() => {
    // Assembly takes ~3s, then show assembled for 0.5s, then fire
    const t1 = setTimeout(() => setPhase("assembled"), 3200);
    const t2 = setTimeout(() => setPhase("flame"), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // When flame phase starts, add a subtle blue tint to the container
  const showFireClass = phase === "flame";

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[420px]">
      {/* Ambient background particles */}
      <AmbientParticles />

      {/* ── Phase 1: Logo tiles assembling from debris ── */}
      <AnimatePresence>
        {(phase === "assembling" || phase === "assembled") && (
          <motion.div
            key="debris-assembly"
            className="relative"
            style={{ width: COLS * TILE_SIZE, height: ROWS * TILE_SIZE }}
            exit={{ opacity: 0, scale: 1.02, filter: "brightness(1.5) blur(2px)" }}
            transition={{ exit: { duration: 0.4 } }}
          >
            {/* Convergence glow */}
            <ConvergenceGlow active={phase === "assembling"} />

            {/* Generate grid of tiles */}
            {hasLogo &&
              logoSrc &&
              Array.from({ length: TOTAL_TILES }, (_, i) => {
                const row = Math.floor(i / COLS);
                const col = i % COLS;
                return (
                  <LogoTile
                    key={i}
                    row={row}
                    col={col}
                    totalRows={ROWS}
                    totalCols={COLS}
                    logoSrc={logoSrc}
                    tileWidth={TILE_SIZE}
                    tileHeight={TILE_SIZE}
                    index={i}
                    totalCount={TOTAL_TILES}
                    delay={0}
                  />
                );
              })}

            {/* If no logo, use gradient tiles */}
            {!hasLogo &&
              Array.from({ length: TOTAL_TILES }, (_, i) => {
                const row = Math.floor(i / COLS);
                const col = i % COLS;
                return (
                  <FallbackTile
                    key={i}
                    row={row}
                    col={col}
                    totalRows={ROWS}
                    totalCols={COLS}
                    tileWidth={TILE_SIZE}
                    tileHeight={TILE_SIZE}
                    index={i}
                    totalCount={TOTAL_TILES}
                  />
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Fully formed logo + blue fire ── */}
      <AnimatePresence>
        {phase === "flame" && (
          <motion.div
            key="complete-logo"
            className="relative flex flex-col items-center"
            initial={{
              opacity: 0,
              scale: 1.03,
              filter: "brightness(1.3) blur(1px)",
            }}
            animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* White flash on transition */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 220,
                height: 220,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(96,165,250,0.3) 40%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Logo container with blue fire */}
            <div className="relative">
              {/* Blue fire effect */}
              <div
                className={`absolute -inset-20 transition-opacity duration-500 ${showFireClass ? "opacity-100" : "opacity-0"}`}
              >
                <BlueFireEffect />
              </div>

              {/* The assembled logo */}
              <motion.div
                className={`relative rounded-2xl overflow-hidden border-2 bg-white/90 p-3 z-10 shadow-2xl ${showFireClass ? "border-blue-300/60 shadow-blue-500/20" : "border-white/40"}`}
                animate={
                  showFireClass
                    ? { y: [-2, 2, -2], boxShadow: ["0 0 30px rgba(59,130,246,0.15)", "0 0 50px rgba(59,130,246,0.25)", "0 0 30px rgba(59,130,246,0.15)"] }
                    : {}
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {hasLogo && logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`Logo ${schoolName}`}
                    width={180}
                    height={180}
                    className="w-auto h-auto max-h-[170px] max-w-[170px] object-contain"
                  />
                ) : (
                  <div className="w-[170px] h-[170px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
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
              </motion.div>
            </div>

            {/* School name */}
            <motion.h2
              className="mt-6 text-2xl xl:text-3xl font-bold text-emerald-900 leading-tight text-center px-4 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {schoolName}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="mt-2 text-emerald-700/50 text-sm text-center px-4 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Sistem Informasi Manajemen Sekolah
            </motion.p>

            {/* Feature badges */}
            <motion.div
              className="mt-5 flex flex-wrap gap-2 justify-center px-4 relative z-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {["Data Siswa", "Data Guru", "Absensi", "Laporan"].map(
                (feature, i) => (
                  <motion.span
                    key={feature}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      duration: 0.3,
                    }}
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
                  </motion.span>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fallback tile for when there's no logo image ────────────────────
function FallbackTile({
  row,
  col,
  totalRows,
  totalCols,
  tileWidth,
  tileHeight,
  index,
  totalCount,
}: {
  row: number;
  col: number;
  totalRows: number;
  totalCols: number;
  tileWidth: number;
  tileHeight: number;
  index: number;
  totalCount: number;
}) {
  const targetX = col * tileWidth;
  const targetY = row * tileHeight;

  const angle = (index / totalCount) * Math.PI * 2 + Math.random() * 0.5;
  const scatterDist = 200 + Math.random() * 250;
  const startX = Math.cos(angle) * scatterDist;
  const startY = Math.sin(angle) * scatterDist;
  const startRotate = (Math.random() - 0.5) * 360;
  const startScale = 0.5 + Math.random() * 0.5;

  const distFromCenter = Math.sqrt(
    Math.pow(col - totalCols / 2, 2) + Math.pow(row - totalRows / 2, 2)
  );
  const maxDist = Math.sqrt(
    Math.pow(totalCols / 2, 2) + Math.pow(totalRows / 2, 2)
  );
  const normalizedDist = distFromCenter / maxDist;
  const stagger = normalizedDist * 1.2 + Math.random() * 0.2;
  const totalDelay = 0.3 + stagger;

  const animDuration = 1.0 + Math.random() * 0.3;

  // Gradient color based on position
  const hue = 160 + (col / totalCols) * 20;
  const saturation = 60 + (row / totalRows) * 20;
  const lightness = 45 + Math.random() * 15;

  return (
    <motion.div
      className="absolute"
      style={{
        width: tileWidth,
        height: tileHeight,
        left: "50%",
        top: "50%",
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        borderRadius: "2px",
      }}
      initial={{
        x: startX - tileWidth / 2,
        y: startY - tileHeight / 2,
        rotate: startRotate,
        scale: startScale,
        opacity: 0,
        boxShadow: "0 0 8px rgba(59,130,246,0.3)",
      }}
      animate={{
        x: targetX - (tileWidth * totalCols) / 2 + tileWidth / 2,
        y: targetY - (tileHeight * totalRows) / 2 + tileHeight / 2,
        rotate: 0,
        scale: 1,
        opacity: 1,
        boxShadow: "0 0 0px transparent",
      }}
      transition={{
        x: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        y: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        rotate: {
          duration: animDuration,
          delay: totalDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
        scale: {
          duration: animDuration * 0.8,
          delay: totalDelay,
          ease: "easeOut",
        },
        opacity: {
          duration: 0.3,
          delay: totalDelay,
        },
      }}
    />
  );
}
