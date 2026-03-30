// Season 6 — Operations & Automation — "Cyber Industrial" Style
// Circuit patterns, industrial orange/steel palette, mechanical animations
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["300", "400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: mono } = loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C6 = {
  orange: "#F97316",
  steel: "#64748B",
  amber: "#F59E0B",
  teal: "#14B8A6",
  red: "#EF4444",
  indigo: "#6366F1",
  dark: {
    bg: "#0C0A09", bg2: "#1C1917", bg3: "#292524",
    text: "#FAFAF9", muted: "rgba(250,250,249,0.5)",
    card: "rgba(249,115,22,0.06)", cardHover: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.15)", borderSoft: "rgba(255,255,255,0.06)",
    glow: "rgba(249,115,22,0.12)",
  },
  light: {
    bg: "#FFFBF5", bg2: "#FFF7ED", bg3: "#FFEDD5",
    text: "#1C1917", muted: "rgba(28,25,23,0.5)",
    card: "rgba(255,255,255,0.9)", cardHover: "rgba(255,255,255,0.95)",
    border: "rgba(249,115,22,0.15)", borderSoft: "rgba(28,25,23,0.08)",
    glow: "rgba(249,115,22,0.06)",
  },
};

export const t6 = (dark: boolean) => dark ? C6.dark : C6.light;

// Circuit board pattern
const CircuitBoard = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const lines = [
    { x1: 100, y1: 200, x2: 400, y2: 200, delay: 0 },
    { x1: 400, y1: 200, x2: 400, y2: 500, delay: 0.5 },
    { x1: 400, y1: 500, x2: 700, y2: 500, delay: 1 },
    { x1: 1200, y1: 150, x2: 1500, y2: 150, delay: 1.5 },
    { x1: 1500, y1: 150, x2: 1500, y2: 400, delay: 2 },
    { x1: 1500, y1: 400, x2: 1800, y2: 400, delay: 2.5 },
    { x1: 200, y1: 800, x2: 600, y2: 800, delay: 3 },
    { x1: 600, y1: 800, x2: 600, y2: 600, delay: 3.5 },
    { x1: 1000, y1: 700, x2: 1400, y2: 700, delay: 4 },
    { x1: 1400, y1: 700, x2: 1400, y2: 900, delay: 4.5 },
  ];

  return (
    <AbsoluteFill style={{ opacity: dark ? 0.15 : 0.08 }}>
      <svg width="1920" height="1080">
        {lines.map((l, i) => {
          const progress = Math.min(1, Math.max(0, (frame - l.delay * 30) / 40));
          const pulse = 0.4 + Math.sin(frame * 0.03 + i * 0.7) * 0.3;
          const cx = l.x1 + (l.x2 - l.x1) * progress;
          const cy = l.y1 + (l.y2 - l.y1) * progress;
          return (
            <React.Fragment key={i}>
              <line x1={l.x1} y1={l.y1} x2={cx} y2={cy}
                stroke={C6.orange} strokeWidth={1.5} opacity={pulse} />
              {progress > 0.1 && (
                <circle cx={cx} cy={cy} r={3} fill={C6.orange} opacity={pulse}>
                </circle>
              )}
              {/* Junction nodes */}
              <circle cx={l.x1} cy={l.y1} r={4} fill="none" stroke={C6.orange} strokeWidth={1} opacity={0.3} />
            </React.Fragment>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Gear rotation animation
const GearSystem = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const gears = [
    { x: 1700, y: 900, r: 80, speed: 1 },
    { x: 1620, y: 830, r: 50, speed: -1.6 },
    { x: 1780, y: 830, r: 45, speed: -1.8 },
    { x: 150, y: 950, r: 60, speed: 0.8 },
    { x: 220, y: 900, r: 35, speed: -1.4 },
  ];

  return (
    <AbsoluteFill style={{ opacity: dark ? 0.08 : 0.04 }}>
      <svg width="1920" height="1080">
        {gears.map((g, i) => {
          const rot = frame * g.speed;
          const teeth = Math.max(6, Math.round(g.r / 8));
          return (
            <g key={i} transform={`translate(${g.x},${g.y}) rotate(${rot})`}>
              <circle r={g.r} fill="none" stroke={C6.steel} strokeWidth={2} />
              {Array.from({ length: teeth }).map((_, t) => {
                const angle = (t / teeth) * Math.PI * 2;
                return (
                  <line key={t}
                    x1={Math.cos(angle) * (g.r - 5)} y1={Math.sin(angle) * (g.r - 5)}
                    x2={Math.cos(angle) * (g.r + 8)} y2={Math.sin(angle) * (g.r + 8)}
                    stroke={C6.orange} strokeWidth={3} opacity={0.5}
                  />
                );
              })}
              <circle r={g.r * 0.3} fill="none" stroke={C6.orange} strokeWidth={1.5} opacity={0.3} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const S6Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t6(dark);
  const angle = 135 + interpolate(frame, [0, 3500], [0, 20]);
  const bg = dark
    ? `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 45%, ${th.bg3} 100%)`
    : `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)`;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <CircuitBoard frame={frame} dark={dark} />
      <GearSystem frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

export const S6Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
  frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number;
}) => {
  const th = t6(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const lineW = interpolate(s1, [0, 1], [0, 240]);

  return (
    <div style={{ direction: "rtl", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{
          fontFamily: mono, fontSize: 13, letterSpacing: "0.2em", color: C6.orange,
          padding: "6px 16px", borderRadius: 20,
          background: `${C6.orange}10`, border: `1px solid ${C6.orange}25`,
          boxShadow: dark ? `0 0 15px ${C6.orange}15` : "none",
        }}>
          SEASON 06 — EP {String(episodeNum).padStart(2, "0")}
        </div>
        <div style={{
          width: lineW, height: 2,
          background: `linear-gradient(90deg, ${C6.orange}, ${C6.amber}, ${C6.teal}50)`,
          boxShadow: dark ? `0 0 8px ${C6.orange}40` : "none",
        }} />
      </div>
      <div style={{
        fontFamily: cairo, fontSize: 66, fontWeight: 900, color: th.text,
        lineHeight: 1.15, marginBottom: 10,
        opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)`,
      }}>{titleAr}</div>
      <div style={{
        fontFamily: inter, fontSize: 32, fontWeight: 300,
        background: `linear-gradient(90deg, ${C6.orange}, ${C6.amber})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        opacity: s3, letterSpacing: "0.03em",
      }}>{titleEn}</div>
      {subtitle && (
        <div style={{
          fontFamily: cairo, fontSize: 24, color: th.muted, marginTop: 10,
          opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }),
        }}>{subtitle}</div>
      )}
    </div>
  );
};

export const S6Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; titleAr: string; titleEn: string; desc: string; color: string;
}) => {
  const th = t6(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{
      display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px",
      borderRadius: 16, background: th.card, border: `1px solid ${th.borderSoft}`,
      opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)`,
      boxShadow: dark ? `0 0 20px ${color}08` : "none",
    }}>
      <div style={{
        fontSize: 32, width: 56, height: 56, borderRadius: 14,
        background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${color}20`,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 3 }}>{titleAr}</div>
        <div style={{ fontFamily: mono, fontSize: 12, color, marginBottom: 8, letterSpacing: "0.05em" }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S6Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; value: string; label: string; labelEn: string; color: string;
}) => {
  const th = t6(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  const glowPulse = 0.5 + Math.sin(frame * 0.04 + delay * 0.1) * 0.3;
  return (
    <div style={{
      width: 220, padding: "28px 22px", borderRadius: 20, textAlign: "center",
      background: th.card, border: `1px solid ${th.borderSoft}`,
      boxShadow: dark ? `0 0 25px ${color}${Math.round(glowPulse * 15).toString(16).padStart(2, "0")}` : "none",
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: mono, fontSize: 34, fontWeight: 700, color,
        marginBottom: 6, letterSpacing: "-0.02em",
      }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 11, color: th.muted, letterSpacing: "0.08em" }}>{labelEn}</div>
    </div>
  );
};

export const S6GearIcon = ({ frame, fps, dark, delay }: {
  frame: number; fps: number; dark: boolean; delay: number;
}) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  const rot = frame * 0.5;
  const pulse = 1 + Math.sin(frame * 0.05) * 0.03;

  return (
    <div style={{
      width: 360, height: 360, position: "relative",
      opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`,
    }}>
      {[180, 230, 280].map((size, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: "50%",
          width: size, height: size, borderRadius: "50%",
          border: `1px solid ${[C6.orange, C6.amber, C6.teal][i]}18`,
          transform: `translate(-50%, -50%) rotate(${rot * (i % 2 === 0 ? 1 : -1) * (0.5 + i * 0.3)}deg)`,
        }}>
          <div style={{
            position: "absolute", top: -4, left: "50%", width: 8, height: 8, borderRadius: "50%",
            background: [C6.orange, C6.amber, C6.teal][i],
            transform: "translateX(-50%)", opacity: 0.7,
          }} />
        </div>
      ))}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        fontSize: 72,
      }}>⚙️</div>
    </div>
  );
};

export const S6Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const th = t6(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.015;
  const r1 = interpolate(frame, [0, 800], [0, 360]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C6.orange}${dark ? "0C" : "06"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        border: `1px solid ${C6.amber}15`, transform: `rotate(${r1}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: C6.amber, transform: "translateX(-50%)", opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, transform: `scale(${interpolate(s1, [0, 1], [0.2, 1])})`, opacity: s1 }}>⚙️</div>
        <div style={{
          fontFamily: inter, fontSize: 76, fontWeight: 900, color: th.text,
          transform: `scale(${pulse})`, opacity: s2, letterSpacing: "-0.02em",
        }}>
          <span style={{ background: `linear-gradient(90deg, ${C6.orange}, ${C6.amber})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 30, fontWeight: 700, color: C6.orange, opacity: s2 }}>سلسلة العمليات والأتمتة</div>
        <div style={{
          fontFamily: mono, fontSize: 14, color: th.muted, opacity: s3,
          background: th.card, padding: "10px 28px", borderRadius: 24,
          border: `1px solid ${th.borderSoft}`, letterSpacing: "0.1em",
        }}>
          SEASON 06 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: EP ${String(episodeNum + 1).padStart(2, "0")}` : "// END OF SEASON 06"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
