import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["300", "400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: mono } = loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C = {
  emerald: "#10B981",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  amber: "#F59E0B",
  rose: "#F43F5E",
  teal: "#14B8A6",
  dark: {
    bg: "#030712", bg2: "#0A0F1E", bg3: "#111827",
    text: "#F9FAFB", muted: "rgba(249,250,251,0.45)",
    card: "rgba(255,255,255,0.04)", cardHover: "rgba(255,255,255,0.07)",
    border: "rgba(16,185,129,0.12)", borderSoft: "rgba(255,255,255,0.06)",
    glow: "rgba(16,185,129,0.08)",
  },
  light: {
    bg: "#FAFBFD", bg2: "#F1F5F9", bg3: "#E8ECF1",
    text: "#0F172A", muted: "rgba(15,23,42,0.5)",
    card: "rgba(255,255,255,0.85)", cardHover: "rgba(255,255,255,0.95)",
    border: "rgba(16,185,129,0.15)", borderSoft: "rgba(15,23,42,0.08)",
    glow: "rgba(16,185,129,0.06)",
  },
};

export const t = (dark: boolean) => dark ? C.dark : C.light;

// Floating gradient orbs
const FloatingOrbs = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const orbs = [
    { x: 200, y: 150, size: 400, color: C.emerald, speed: 0.008, phase: 0 },
    { x: 1500, y: 700, size: 350, color: C.cyan, speed: 0.006, phase: 2 },
    { x: 900, y: 200, size: 300, color: C.indigo, speed: 0.01, phase: 4 },
    { x: 1600, y: 200, size: 250, color: C.emerald, speed: 0.007, phase: 1 },
  ];
  return (
    <AbsoluteFill>
      {orbs.map((o, i) => {
        const ox = o.x + Math.sin(frame * o.speed + o.phase) * 60;
        const oy = o.y + Math.cos(frame * o.speed * 1.3 + o.phase) * 40;
        return (
          <div key={i} style={{
            position: "absolute", left: ox - o.size / 2, top: oy - o.size / 2,
            width: o.size, height: o.size, borderRadius: "50%",
            background: `radial-gradient(circle, ${o.color}${dark ? "0A" : "08"} 0%, transparent 70%)`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

// Clean horizontal line accents
const LineAccents = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const th = t(dark);
  return (
    <AbsoluteFill>
      {[120, 960].map((y, i) => {
        const w = interpolate(frame, [i * 30, i * 30 + 200], [0, 1920], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={i} style={{ position: "absolute", left: 0, top: y, width: w, height: 1, background: `linear-gradient(90deg, transparent, ${C.emerald}15, transparent)` }} />;
      })}
      {/* Corner marks */}
      {[[40, 40], [1840, 40], [40, 1000], [1840, 1000]].map(([x, y], i) => (
        <React.Fragment key={`c${i}`}>
          <div style={{ position: "absolute", left: x, top: y, width: 20, height: 1, background: `${C.emerald}25` }} />
          <div style={{ position: "absolute", left: x, top: y, width: 1, height: 20, background: `${C.emerald}25` }} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// S3 Background
export const S3Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t(dark);
  const angle = 135 + interpolate(frame, [0, 3500], [0, 20]);
  const bg = dark
    ? `linear-gradient(${angle}deg, ${C.dark.bg} 0%, ${C.dark.bg2} 50%, ${C.dark.bg3} 100%)`
    : `linear-gradient(${angle}deg, ${C.light.bg} 0%, ${C.light.bg2} 50%, ${C.light.bg3} 100%)`;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <FloatingOrbs frame={frame} dark={dark} />
      <LineAccents frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

// Season 3 Section Header — cleaner, more spacious
export const S3Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
  frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number;
}) => {
  const th = t(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const lineW = interpolate(s1, [0, 1], [0, 200]);

  return (
    <div style={{ direction: "rtl", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.2em", color: C.emerald, padding: "6px 16px", borderRadius: 20, background: `${C.emerald}10`, border: `1px solid ${C.emerald}20` }}>
          SEASON 03 — EP {String(episodeNum).padStart(2, "0")}
        </div>
        <div style={{ width: lineW, height: 1, background: `linear-gradient(90deg, ${C.emerald}, ${C.cyan}50)` }} />
      </div>
      <div style={{
        fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text,
        lineHeight: 1.15, marginBottom: 10, letterSpacing: "-0.01em",
        opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)`,
      }}>{titleAr}</div>
      <div style={{
        fontFamily: inter, fontSize: 30, fontWeight: 300, color: C.emerald,
        opacity: s3, letterSpacing: "0.03em",
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

// Glass Card
export const GlassCard = ({ frame, fps, dark, delay, children, style }: {
  frame: number; fps: number; dark: boolean; delay: number; children: React.ReactNode; style?: React.CSSProperties;
}) => {
  const th = t(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 160 } });
  return (
    <div style={{
      background: th.card, border: `1px solid ${th.borderSoft}`,
      borderRadius: 16, padding: "28px 32px", position: "relative", overflow: "hidden",
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.96, 1])})`,
      ...style,
    }}>
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${C.emerald}30, transparent)` }} />
      {children}
    </div>
  );
};

// Animated Number Counter
export const AnimCounter = ({ frame, fps, delay, target, suffix, color, size }: {
  frame: number; fps: number; delay: number; target: number; suffix?: string; color?: string; size?: number;
}) => {
  const progress = interpolate(frame - delay, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const val = Math.round(target * progress);
  return (
    <span style={{ fontFamily: mono, fontSize: size || 36, fontWeight: 700, color: color || C.emerald }}>
      {val.toLocaleString()}{suffix || ""}
    </span>
  );
};

// Progress Ring SVG
export const ProgressRing = ({ frame, fps, delay, percent, size, color, label, dark }: {
  frame: number; fps: number; delay: number; percent: number; size: number; color: string; label: string; dark: boolean;
}) => {
  const th = t(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const progress = interpolate(frame - delay, [0, 80], [0, percent / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const offset = circ * (1 - progress);
  const displayVal = Math.round(percent * Math.min(1, Math.max(0, (frame - delay) / 80)));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: s }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "none" }} />
      </svg>
      <div style={{ position: "absolute", marginTop: size * 0.3, fontFamily: mono, fontSize: size * 0.22, fontWeight: 700, color }}>{displayVal}%</div>
      <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, textAlign: "center" }}>{label}</div>
    </div>
  );
};

// Feature Row with icon
export const S3Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; titleAr: string; titleEn: string; desc: string; color?: string;
}) => {
  const th = t(dark);
  const c = color || C.emerald;
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 160 } });
  return (
    <div style={{
      display: "flex", gap: 20, direction: "rtl", alignItems: "flex-start",
      opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `${c}12`, border: `1px solid ${c}20`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: th.text, marginBottom: 2 }}>{titleAr}</div>
        <div style={{ fontFamily: inter, fontSize: 16, color: c, letterSpacing: "0.05em", marginBottom: 6 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 19, color: th.muted, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
};

// Stat Block
export const S3Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; value: string; label: string; labelEn?: string; color?: string;
}) => {
  const th = t(dark);
  const c = color || C.emerald;
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 160 } });
  const pulse = Math.sin(frame * 0.04) * 0.3 + 0.7;
  return (
    <div style={{
      background: th.card, border: `1px solid ${th.borderSoft}`, borderRadius: 16,
      padding: "28px 24px", textAlign: "center", position: "relative", overflow: "hidden",
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)`,
      minWidth: 180,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: pulse * 0.5 }} />
      <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, color: c, marginBottom: 8 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 15, color: th.text, direction: "rtl" }}>{label}</div>
      {labelEn && <div style={{ fontFamily: inter, fontSize: 11, color: th.muted, marginTop: 4 }}>{labelEn}</div>}
    </div>
  );
};

// Dashboard Mockup — enhanced
export const S3Dashboard = ({ frame, fps, dark, delay, title }: {
  frame: number; fps: number; dark: boolean; delay: number; title?: string;
}) => {
  const th = t(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 140 } });
  const bars = [55, 78, 42, 92, 65, 85, 48, 70, 88, 60];

  return (
    <div style={{
      background: th.card, border: `1px solid ${th.borderSoft}`, borderRadius: 20,
      padding: 28, opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
      width: 460, position: "relative", overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[C.emerald, C.cyan, C.amber].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.5 }} />
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: th.muted }}>{title || "iRecycle Platform"}</div>
      </div>
      {/* Mini chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginBottom: 20 }}>
        {bars.map((h, i) => {
          const barS = spring({ frame: frame - delay - 15 - i * 4, fps, config: { damping: 16 } });
          return (
            <div key={i} style={{
              flex: 1, height: `${h * barS}%`, borderRadius: 6,
              background: `linear-gradient(180deg, ${i % 3 === 0 ? C.emerald : i % 3 === 1 ? C.cyan : C.indigo}, ${i % 3 === 0 ? C.emerald : i % 3 === 1 ? C.cyan : C.indigo}60)`,
            }} />
          );
        })}
      </div>
      {/* Mini stat row */}
      <div style={{ display: "flex", gap: 12 }}>
        {[{ l: "Active", v: "2,847", c: C.emerald }, { l: "Pending", v: "156", c: C.amber }, { l: "Done", v: "12.4K", c: C.cyan }].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 12px", background: `${s.c}08`, borderRadius: 10, border: `1px solid ${s.c}15` }}>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: inter, fontSize: 10, color: th.muted }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Outro
export const S3Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const th = t(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.015;

  // Animated rings
  const r1 = interpolate(frame, [0, 800], [0, 360]);
  const r2 = interpolate(frame, [0, 800], [0, -180]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.emerald}${dark ? "0C" : "06"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      {/* Orbit ring 1 */}
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        border: `1px solid ${C.emerald}15`, transform: `rotate(${r1}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: C.emerald, transform: "translateX(-50%)", opacity: 0.6 }} />
      </div>
      {/* Orbit ring 2 */}
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        border: `1px solid ${C.cyan}10`, transform: `rotate(${r2}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", bottom: -4, left: "50%", width: 8, height: 8, borderRadius: "50%", background: C.cyan, transform: "translateX(-50%)", opacity: 0.4 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, transform: `scale(${interpolate(s1, [0, 1], [0.2, 1])})`, opacity: s1 }}>♻️</div>
        <div style={{
          fontFamily: inter, fontSize: 76, fontWeight: 900, color: th.text,
          transform: `scale(${pulse})`, opacity: s2, letterSpacing: "-0.02em",
        }}>
          <span style={{ color: C.emerald }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 30, fontWeight: 700, color: C.emerald, opacity: s2 }}>آي ريسايكل</div>
        <div style={{
          fontFamily: mono, fontSize: 13, color: th.muted, opacity: s3,
          background: th.card, padding: "10px 28px", borderRadius: 24,
          border: `1px solid ${th.borderSoft}`, letterSpacing: "0.1em",
        }}>
          SEASON 03 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: EP ${String(episodeNum + 1).padStart(2, "0")}` : "// END OF SEASON 03"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
