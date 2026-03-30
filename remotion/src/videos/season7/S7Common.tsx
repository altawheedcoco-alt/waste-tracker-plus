// Season 7 — IoT & Smart Sensors — "Neon Matrix" Style
// Glowing data streams, sensor nodes, pulsing green/cyan matrix aesthetic
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFira } from "@remotion/google-fonts/FiraCode";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["300", "400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: fira } = loadFira("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C7 = {
  neon: "#00FF88",
  cyan: "#06B6D4",
  matrix: "#22C55E",
  electric: "#3B82F6",
  pulse: "#A855F7",
  warm: "#F59E0B",
  dark: {
    bg: "#030712", bg2: "#0A1628", bg3: "#111827",
    text: "#F0FDF4", muted: "rgba(240,253,244,0.5)",
    card: "rgba(0,255,136,0.04)", cardHover: "rgba(0,255,136,0.08)",
    border: "rgba(0,255,136,0.12)", borderSoft: "rgba(255,255,255,0.05)",
    glow: "rgba(0,255,136,0.15)",
  },
  light: {
    bg: "#F0FDF4", bg2: "#ECFDF5", bg3: "#D1FAE5",
    text: "#052E16", muted: "rgba(5,46,22,0.5)",
    card: "rgba(255,255,255,0.92)", cardHover: "rgba(255,255,255,0.96)",
    border: "rgba(0,255,136,0.15)", borderSoft: "rgba(5,46,22,0.06)",
    glow: "rgba(0,255,136,0.08)",
  },
};

export const t7 = (dark: boolean) => dark ? C7.dark : C7.light;

// Matrix rain background
const MatrixRain = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const cols = 30;
  const chars = "01アイリサイクルIOTセンサー";
  return (
    <AbsoluteFill style={{ opacity: dark ? 0.12 : 0.05 }}>
      <svg width="1920" height="1080">
        {Array.from({ length: cols }).map((_, i) => {
          const x = (i / cols) * 1920 + 32;
          const speed = 1 + (i % 4) * 0.4;
          const offset = (frame * speed + i * 120) % 1200;
          return Array.from({ length: 8 }).map((_, j) => {
            const y = (offset + j * 60) % 1200 - 60;
            const char = chars[(i * 7 + j * 3 + Math.floor(frame / 10)) % chars.length];
            const fade = Math.max(0, 1 - j * 0.15);
            return (
              <text key={`${i}-${j}`} x={x} y={y}
                fill={j === 0 ? "#fff" : C7.neon}
                fontSize={14} fontFamily="monospace" opacity={fade * 0.8}>
                {char}
              </text>
            );
          });
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Sensor network nodes
const SensorNetwork = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const nodes = [
    { x: 200, y: 150 }, { x: 500, y: 300 }, { x: 800, y: 180 },
    { x: 1100, y: 350 }, { x: 1400, y: 200 }, { x: 1700, y: 300 },
    { x: 350, y: 600 }, { x: 700, y: 700 }, { x: 1050, y: 650 },
    { x: 1350, y: 750 }, { x: 1600, y: 600 }, { x: 300, y: 900 },
    { x: 900, y: 880 }, { x: 1500, y: 880 },
  ];
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [8, 9], [9, 10],
    [1, 6], [2, 7], [3, 8], [4, 9], [5, 10], [7, 12], [11, 6], [10, 13],
  ];

  return (
    <AbsoluteFill style={{ opacity: dark ? 0.1 : 0.05 }}>
      <svg width="1920" height="1080">
        {connections.map(([a, b], i) => {
          const pulse = 0.3 + Math.sin(frame * 0.03 + i * 0.5) * 0.3;
          const dataPos = ((frame * 2 + i * 30) % 100) / 100;
          const dx = nodes[b].x - nodes[a].x;
          const dy = nodes[b].y - nodes[a].y;
          return (
            <React.Fragment key={`c-${i}`}>
              <line x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
                stroke={C7.cyan} strokeWidth={1} opacity={pulse} />
              <circle cx={nodes[a].x + dx * dataPos} cy={nodes[a].y + dy * dataPos}
                r={2} fill={C7.neon} opacity={pulse * 2} />
            </React.Fragment>
          );
        })}
        {nodes.map((n, i) => {
          const p = 0.5 + Math.sin(frame * 0.05 + i) * 0.3;
          return (
            <React.Fragment key={`n-${i}`}>
              <circle cx={n.x} cy={n.y} r={12} fill="none" stroke={C7.neon} strokeWidth={1} opacity={p} />
              <circle cx={n.x} cy={n.y} r={4} fill={C7.neon} opacity={p * 0.8} />
            </React.Fragment>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const S7Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t7(dark);
  const angle = 160 + interpolate(frame, [0, 3500], [0, 15]);
  const bg = dark
    ? `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)`
    : `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)`;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <MatrixRain frame={frame} dark={dark} />
      <SensorNetwork frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

export const S7Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
  frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number;
}) => {
  const th = t7(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const scanLine = interpolate(s1, [0, 1], [0, 300]);

  return (
    <div style={{ direction: "rtl", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{
          fontFamily: fira, fontSize: 13, letterSpacing: "0.2em", color: C7.neon,
          padding: "6px 16px", borderRadius: 20,
          background: `${C7.neon}08`, border: `1px solid ${C7.neon}20`,
          boxShadow: dark ? `0 0 20px ${C7.neon}15, inset 0 0 10px ${C7.neon}05` : "none",
        }}>
          S07 — EP {String(episodeNum).padStart(2, "0")} — IoT
        </div>
        <div style={{
          width: scanLine, height: 2,
          background: `linear-gradient(90deg, ${C7.neon}, ${C7.cyan}, transparent)`,
          boxShadow: dark ? `0 0 12px ${C7.neon}50` : "none",
        }} />
      </div>
      <div style={{
        fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text,
        lineHeight: 1.15, marginBottom: 10,
        opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)`,
        textShadow: dark ? `0 0 30px ${C7.neon}20` : "none",
      }}>{titleAr}</div>
      <div style={{
        fontFamily: inter, fontSize: 30, fontWeight: 300,
        background: `linear-gradient(90deg, ${C7.neon}, ${C7.cyan})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        opacity: s3, letterSpacing: "0.04em",
      }}>{titleEn}</div>
      {subtitle && (
        <div style={{
          fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10,
          opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }),
        }}>{subtitle}</div>
      )}
    </div>
  );
};

export const S7Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; titleAr: string; titleEn: string; desc: string; color: string;
}) => {
  const th = t7(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  const glow = 0.5 + Math.sin(frame * 0.04 + delay * 0.1) * 0.3;
  return (
    <div style={{
      display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px",
      borderRadius: 16, background: th.card, border: `1px solid ${color}15`,
      opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
      boxShadow: dark ? `0 0 20px ${color}${Math.round(glow * 12).toString(16).padStart(2, "0")}` : "none",
    }}>
      <div style={{
        fontSize: 30, width: 54, height: 54, borderRadius: 14,
        background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${color}20`, boxShadow: dark ? `0 0 15px ${color}15` : "none",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: fira, fontSize: 11, color, marginBottom: 8, letterSpacing: "0.06em" }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S7Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; value: string; label: string; labelEn: string; color: string;
}) => {
  const th = t7(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  const glow = 0.5 + Math.sin(frame * 0.04 + delay * 0.1) * 0.3;
  return (
    <div style={{
      width: 220, padding: "28px 22px", borderRadius: 20, textAlign: "center",
      background: th.card, border: `1px solid ${color}12`,
      boxShadow: dark ? `0 0 30px ${color}${Math.round(glow * 12).toString(16).padStart(2, "0")}` : "none",
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: fira, fontSize: 32, fontWeight: 700, color,
        marginBottom: 6, letterSpacing: "-0.02em",
        textShadow: dark ? `0 0 20px ${color}40` : "none",
      }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: fira, fontSize: 11, color: th.muted, letterSpacing: "0.08em" }}>{labelEn}</div>
    </div>
  );
};

export const S7Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const th = t7(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.02;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C7.neon}${dark ? "0A" : "05"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, transform: `scale(${interpolate(s1, [0, 1], [0.2, 1])})`, opacity: s1 }}>📡</div>
        <div style={{
          fontFamily: inter, fontSize: 72, fontWeight: 900, color: th.text,
          transform: `scale(${pulse})`, opacity: s2,
        }}>
          <span style={{ background: `linear-gradient(90deg, ${C7.neon}, ${C7.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C7.neon, opacity: s2 }}>سلسلة إنترنت الأشياء والمستشعرات</div>
        <div style={{
          fontFamily: fira, fontSize: 14, color: th.muted, opacity: s3,
          background: th.card, padding: "10px 28px", borderRadius: 24,
          border: `1px solid ${th.borderSoft}`, letterSpacing: "0.1em",
        }}>
          S07 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: ${nextTitle}` : "// END OF SEASON 07"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
