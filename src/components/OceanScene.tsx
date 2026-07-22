"use client";

export default function OceanScene() {
  /* ------------------------------------------------------------------ */
  /*  Bubbles (18) – semi-transparent circles with inner highlight      */
  /* ------------------------------------------------------------------ */
  const bubbles: {
    left: string;
    bottom: string;
    size: number;
    delay: string;
    duration: string;
  }[] = [
    { left: "5%",  bottom: "10%", size: 12, delay: "0s",   duration: "7s"  },
    { left: "12%", bottom: "5%",  size: 20, delay: "1.2s", duration: "9s"  },
    { left: "22%", bottom: "15%", size: 8,  delay: "0.4s", duration: "6s"  },
    { left: "30%", bottom: "8%",  size: 28, delay: "2.5s", duration: "10s" },
    { left: "38%", bottom: "20%", size: 14, delay: "0.8s", duration: "7.5s"},
    { left: "45%", bottom: "3%",  size: 40, delay: "3.1s", duration: "12s" },
    { left: "52%", bottom: "12%", size: 10, delay: "1.7s", duration: "8s"  },
    { left: "58%", bottom: "18%", size: 22, delay: "0.2s", duration: "9.5s"},
    { left: "65%", bottom: "6%",  size: 16, delay: "2.8s", duration: "8.5s"},
    { left: "72%", bottom: "14%", size: 32, delay: "1.0s", duration: "11s" },
    { left: "78%", bottom: "9%",  size: 18, delay: "3.5s", duration: "7.8s"},
    { left: "85%", bottom: "22%", size: 11, delay: "0.6s", duration: "6.5s"},
    { left: "90%", bottom: "4%",  size: 24, delay: "2.0s", duration: "10s" },
    { left: "95%", bottom: "16%", size: 15, delay: "1.4s", duration: "8.2s"},
    { left: "18%", bottom: "25%", size: 9,  delay: "3.8s", duration: "6.8s"},
    { left: "48%", bottom: "28%", size: 36, delay: "0.9s", duration: "13s" },
    { left: "68%", bottom: "30%", size: 13, delay: "2.2s", duration: "7.2s"},
    { left: "82%", bottom: "26%", size: 19, delay: "1.6s", duration: "9.8s"},
  ];

  /* ------------------------------------------------------------------ */
  /*  Light Rays (5) – diagonal trapezoids from top-left                */
  /* ------------------------------------------------------------------ */
  const rays: {
    left: string;
    width: number;
    height: string;
    rotate: number;
    delay: string;
    duration: string;
    opacity: number;
  }[] = [
    { left: "5%",  width: 120, height: "140%", rotate: 25, delay: "0s",   duration: "8s",  opacity: 0.07 },
    { left: "20%", width: 80,  height: "150%", rotate: 30, delay: "2s",   duration: "10s", opacity: 0.05 },
    { left: "35%", width: 100, height: "130%", rotate: 20, delay: "4s",   duration: "9s",  opacity: 0.06 },
    { left: "55%", width: 60,  height: "160%", rotate: 35, delay: "1s",   duration: "11s", opacity: 0.04 },
    { left: "70%", width: 90,  height: "135%", rotate: 28, delay: "3s",   duration: "7.5s",opacity: 0.055},
  ];

  /* ------------------------------------------------------------------ */
  /*  Seaweed (8) – SVG wavy kelp shapes in greens                      */
  /* ------------------------------------------------------------------ */
  const seaweeds: {
    left: string;
    height: number;
    color: string;
    delay: string;
    flip: boolean;
  }[] = [
    { left: "3%",   height: 160, color: "#1a6b3c", delay: "0s",   flip: false },
    { left: "10%",  height: 120, color: "#228b22", delay: "1.2s", flip: true  },
    { left: "18%",  height: 180, color: "#2e8b57", delay: "0.5s", flip: false },
    { left: "35%",  height: 100, color: "#3cb371", delay: "2.0s", flip: true  },
    { left: "55%",  height: 200, color: "#1a6b3c", delay: "0.8s", flip: false },
    { left: "70%",  height: 140, color: "#228b22", delay: "1.5s", flip: true  },
    { left: "85%",  height: 170, color: "#2e8b57", delay: "2.5s", flip: false },
    { left: "94%",  height: 110, color: "#3cb371", delay: "0.3s", flip: true  },
  ];

  /**
   * Generate a wavy kelp SVG path for a given height.
   * The path starts at the bottom-center, curves up in an S-shape,
   * and ends at the top with a rounded tip.
   */
  const kelpPath = (h: number): string => {
    const w = h * 0.15;
    const segments = 4;
    const segH = h / segments;
    let d = `M ${w / 2} ${h}`;
    for (let i = 0; i < segments; i++) {
      const yStart = h - i * segH;
      const yEnd = h - (i + 1) * segH;
      const dir = i % 2 === 0 ? 1 : -1;
      const bulge = w * 0.6 * dir;
      const cp1x = w / 2 + bulge;
      const cp1y = yStart - segH * 0.33;
      const cp2x = w / 2 - bulge * 0.5;
      const cp2y = yStart - segH * 0.66;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${w / 2 + bulge * 0.3} ${yEnd}`;
    }
    // rounded tip
    const tipY = 0;
    const tipR = w * 0.25;
    d += ` Q ${w / 2 + tipR} ${tipY - tipR}, ${w / 2} ${tipY - tipR * 0.5}`;
    d += ` Q ${w / 2 - tipR} ${tipY - tipR}, ${w / 2 - w * 0.1} ${tipY}`;
    // return along the other edge with opposite curves
    for (let i = segments - 1; i >= 0; i--) {
      const yStart = h - i * segH;
      const yEnd = h - (i + 1) * segH;
      const dir = i % 2 === 0 ? -1 : 1;
      const bulge = w * 0.4 * dir;
      const cp1x = w / 2 + bulge;
      const cp1y = yEnd + segH * 0.34;
      const cp2x = w / 2 - bulge * 0.5;
      const cp2y = yEnd + segH * 0.68;
      d += ` C ${cp2x} ${cp2y}, ${cp1x} ${cp1y}, ${w / 2 - w * 0.05} ${yStart}`;
    }
    d += " Z";
    return d;
  };

  /* ------------------------------------------------------------------ */
  /*  Fish (4) – simple SVG fish (teardrop body + tail + eye)           */
  /* ------------------------------------------------------------------ */
  const fishes: {
    top: string;
    color: string;
    bodyColor: string;
    delay: string;
    duration: string;
    scale: number;
  }[] = [
    { top: "25%", color: "#ff8c00", bodyColor: "#ffa940", delay: "0s",   duration: "18s", scale: 1.0  },
    { top: "55%", color: "#4da6ff", bodyColor: "#6db9f2", delay: "5s",   duration: "22s", scale: 0.8  },
    { top: "40%", color: "#ffd700", bodyColor: "#ffe44d", delay: "10s",  duration: "20s", scale: 1.2  },
    { top: "70%", color: "#ff6b6b", bodyColor: "#ff8e8e", delay: "3s",   duration: "25s", scale: 0.7  },
  ];

  const FishSvg = ({
    color,
    bodyColor,
    scale,
  }: {
    color: string;
    bodyColor: string;
    scale: number;
  }) => (
    <svg
      viewBox="0 0 60 30"
      width={60 * scale}
      height={30 * scale}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tail */}
      <polygon points="0,15 12,5 12,25" fill={color} opacity="0.85" />
      {/* Body – teardrop ellipse */}
      <ellipse cx="30" cy="15" rx="22" ry="11" fill={bodyColor} />
      <ellipse cx="30" cy="15" rx="22" ry="11" fill="url(#fishGrad)" opacity="0.3" />
      {/* Dorsal fin */}
      <path d="M22 4 Q30 -2 38 4" fill={color} opacity="0.7" />
      {/* Pectoral fin */}
      <path d="M26 22 Q30 28 36 22" fill={color} opacity="0.5" />
      {/* Eye */}
      <circle cx="42" cy="12" r="3" fill="white" />
      <circle cx="43" cy="11.5" r="1.5" fill="#1a1a2e" />
      {/* Mouth */}
      <path d="M50 15 Q52 14.5 52 15 Q52 15.5 50 15.5" stroke={color} strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Scales hint lines */}
      <path d="M24 10 Q28 12 24 14" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
      <path d="M30 9 Q34 12 30 15" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
      <path d="M36 10 Q40 12 36 14" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="fishGrad" x1="20" y1="5" x2="45" y2="25">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );

  /* ------------------------------------------------------------------ */
  /*  Floating Particles (24) – tiny drifting dots                      */
  /* ------------------------------------------------------------------ */
  const particles: {
    left: string;
    top: string;
    size: number;
    delay: string;
    duration: string;
    opacity: number;
  }[] = [
    { left: "8%",  top: "20%", size: 2, delay: "0s",   duration: "15s", opacity: 0.4 },
    { left: "15%", top: "45%", size: 3, delay: "1.3s", duration: "18s", opacity: 0.3 },
    { left: "22%", top: "70%", size: 2, delay: "3.0s", duration: "14s", opacity: 0.5 },
    { left: "30%", top: "15%", size: 4, delay: "0.7s", duration: "20s", opacity: 0.25},
    { left: "37%", top: "55%", size: 2, delay: "2.5s", duration: "16s", opacity: 0.45},
    { left: "42%", top: "30%", size: 3, delay: "4.0s", duration: "19s", opacity: 0.35},
    { left: "50%", top: "80%", size: 2, delay: "1.8s", duration: "13s", opacity: 0.5 },
    { left: "56%", top: "10%", size: 4, delay: "0.3s", duration: "22s", opacity: 0.2 },
    { left: "62%", top: "50%", size: 2, delay: "3.5s", duration: "17s", opacity: 0.4 },
    { left: "68%", top: "35%", size: 3, delay: "2.0s", duration: "15s", opacity: 0.3 },
    { left: "74%", top: "65%", size: 2, delay: "4.5s", duration: "21s", opacity: 0.35},
    { left: "80%", top: "25%", size: 4, delay: "1.0s", duration: "14s", opacity: 0.25},
    { left: "86%", top: "75%", size: 2, delay: "3.2s", duration: "18s", opacity: 0.45},
    { left: "91%", top: "40%", size: 3, delay: "0.5s", duration: "16s", opacity: 0.3 },
    { left: "4%",  top: "60%", size: 2, delay: "2.8s", duration: "20s", opacity: 0.4 },
    { left: "25%", top: "88%", size: 3, delay: "1.5s", duration: "19s", opacity: 0.35},
    { left: "48%", top: "5%",  size: 2, delay: "3.8s", duration: "15s", opacity: 0.5 },
    { left: "65%", top: "92%", size: 4, delay: "0.9s", duration: "22s", opacity: 0.2 },
    { left: "78%", top: "48%", size: 2, delay: "4.2s", duration: "17s", opacity: 0.4 },
    { left: "13%", top: "33%", size: 3, delay: "2.3s", duration: "14s", opacity: 0.3 },
    { left: "53%", top: "72%", size: 2, delay: "1.1s", duration: "21s", opacity: 0.45},
    { left: "88%", top: "18%", size: 3, delay: "3.6s", duration: "16s", opacity: 0.3 },
    { left: "34%", top: "42%", size: 2, delay: "0.4s", duration: "18s", opacity: 0.5 },
    { left: "72%", top: "85%", size: 4, delay: "2.7s", duration: "20s", opacity: 0.25},
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden z-0"
      style={{ position: "fixed" }}
    >
      {/* ============================================================ */}
      {/*  DEEP OCEAN GRADIENT BACKGROUND                               */}
      {/* ============================================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #0a1628 0%, #0c2444 15%, #0e3b5e 35%, #0d4f6e 55%, #0b5e7a 75%, #086e82 100%)",
        }}
      />

      {/* ============================================================ */}
      {/*  LIGHT RAYS                                                   */}
      {/* ============================================================ */}
      {rays.map((ray, i) => (
        <div
          key={`ray-${i}`}
          className="ocean-ray pointer-events-none"
          style={{
            position: "absolute",
            left: ray.left,
            top: "-20%",
            width: ray.width,
            height: ray.height,
            transform: `rotate(${ray.rotate}deg)`,
            animationDelay: ray.delay,
            animationDuration: ray.duration,
            opacity: ray.opacity,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(130,220,255,0.08) 60%, transparent 100%)",
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
          }}
        />
      ))}

      {/* ============================================================ */}
      {/*  WAVE SURFACE (looking up at water surface)                   */}
      {/* ============================================================ */}
      <div
        className="ocean-surface pointer-events-none"
        style={{ position: "absolute", top: 0, left: 0, width: "200%", height: 80 }}
      >
        <svg
          viewBox="0 0 2880 80"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="surfaceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#0e4a6e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="causticGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(120,210,255,0.15)" />
              <stop offset="50%" stopColor="rgba(200,240,255,0.25)" />
              <stop offset="100%" stopColor="rgba(120,210,255,0.15)" />
            </linearGradient>
          </defs>
          {/* Main wave fill */}
          <path
            d="M0 40 Q120 10 240 40 Q360 70 480 40 Q600 10 720 40 Q840 70 960 40 Q1080 10 1200 40 Q1320 70 1440 40 Q1560 10 1680 40 Q1800 70 1920 40 Q2040 10 2160 40 Q2280 70 2400 40 Q2520 10 2640 40 Q2760 70 2880 40 L2880 0 L0 0 Z"
            fill="url(#surfaceGrad)"
          />
          {/* Caustic light strip */}
          <path
            d="M0 40 Q120 10 240 40 Q360 70 480 40 Q600 10 720 40 Q840 70 960 40 Q1080 10 1200 40 Q1320 70 1440 40 Q1560 10 1680 40 Q1800 70 1920 40 Q2040 10 2160 40 Q2280 70 2400 40 Q2520 10 2640 40 Q2760 70 2880 40"
            fill="none"
            stroke="url(#causticGrad)"
            strokeWidth="3"
          />
          {/* Secondary subtle wave */}
          <path
            d="M0 50 Q180 30 360 50 Q540 70 720 50 Q900 30 1080 50 Q1260 70 1440 50 Q1620 30 1800 50 Q1980 70 2160 50 Q2340 30 2520 50 Q2700 70 2880 50 L2880 0 L0 0 Z"
            fill="rgba(10,30,60,0.3)"
          />
        </svg>
      </div>

      {/* ============================================================ */}
      {/*  SEAWEED                                                      */}
      {/* ============================================================ */}
      {seaweeds.map((sw, i) => {
        const w = sw.height * 0.15;
        const inner = (
          <div
            key={`seaweed-${i}`}
            className="ocean-seaweed pointer-events-none"
            style={{
              position: "absolute",
              left: sw.left,
              bottom: 0,
              width: w,
              height: sw.height,
              animationDelay: sw.delay,
              transformOrigin: "bottom center",
            }}
          >
            <svg
              viewBox={`0 ${-(w * 0.3)} ${w} ${sw.height + w * 0.3}`}
              width={w}
              height={sw.height}
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`swGrad-${i}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={sw.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={sw.color} stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path d={kelpPath(sw.height)} fill={`url(#swGrad-${i})`} />
              {/* Center vein line */}
              <path
                d={kelpPath(sw.height)}
                fill="none"
                stroke={sw.color}
                strokeWidth="0.5"
                opacity="0.3"
                strokeDasharray="4 6"
              />
            </svg>
          </div>
        );
        return sw.flip ? (
          <div key={`seaweed-wrap-${i}`} style={{ position: "absolute", left: sw.left, bottom: 0, width: w, height: sw.height, transform: "scaleX(-1)", transformOrigin: "bottom center", pointerEvents: "none" }}>
            <div className="ocean-seaweed" style={{ animationDelay: sw.delay, width: w, height: sw.height, transformOrigin: "bottom center" }}>
              <svg viewBox={`0 ${-(w * 0.3)} ${w} ${sw.height + w * 0.3}`} width={w} height={sw.height} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`swGrad-f-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={sw.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={sw.color} stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <path d={kelpPath(sw.height)} fill={`url(#swGrad-f-${i})`} />
                <path d={kelpPath(sw.height)} fill="none" stroke={sw.color} strokeWidth="0.5" opacity="0.3" strokeDasharray="4 6" />
              </svg>
            </div>
          </div>
        ) : inner;
      })}

      {/* ============================================================ */}
      {/*  FISH                                                         */}
      {/* ============================================================ */}
      {fishes.map((fish, i) => (
        <div
          key={`fish-${i}`}
          className="ocean-fish pointer-events-none"
          style={{
            position: "absolute",
            top: fish.top,
            left: "-80px",
            animationDelay: fish.delay,
            animationDuration: fish.duration,
          }}
        >
          <FishSvg
            color={fish.color}
            bodyColor={fish.bodyColor}
            scale={fish.scale}
          />
        </div>
      ))}

      {/* ============================================================ */}
      {/*  BUBBLES                                                      */}
      {/* ============================================================ */}
      {bubbles.map((b, i) => (
        <div
          key={`bubble-${i}`}
          className="ocean-bubble pointer-events-none"
          style={{
            position: "absolute",
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        >
          {/* Inner highlight – simulates pseudo-element */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "22%",
              width: "30%",
              height: "30%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.6), transparent 70%)",
            }}
          />
        </div>
      ))}

      {/* ============================================================ */}
      {/*  FLOATING PARTICLES                                           */}
      {/* ============================================================ */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          className="ocean-particle pointer-events-none"
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: "rgba(180, 220, 255, 0.5)",
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* ============================================================ */}
      {/*  SANDY / DARK FLOOR GRADIENT                                  */}
      {/* ============================================================ */}
      <div
        className="pointer-events-none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,25,40,0.4) 50%, rgba(8,20,32,0.7) 100%)",
        }}
      />
    </div>
  );
}