// Season 5 — AI Deep Dive — "Neural Digital" Style
// Glowing neural networks, data streams, electric blue/violet palette
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["300", "400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: mono } = loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C5 = {
  electric: "#3B82F6",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  magenta: "#EC4899",
  emerald: "#10B981",
  amber: "#F59E0B",
  dark: {
    bg: "#050816", bg2: "#0B1120", bg3: "#111936",
    text: "#F1F5F9", muted: "rgba(241,245,249,0.45)",
    card: "rgba(59,130,246,0.06)", cardHover: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.15)", borderSoft: "rgba(255,255,255,0.06)",
    glow: "rgba(59,130,246,0.12)",
  },
  light: {
    bg: "#F8FAFF", bg2: "#EEF2FF", bg3: "#E0E7FF",
    text: "#0F172A", muted: "rgba(15,23,42,0.5)",
    card: "rgba(255,255,255,0.9)", cardHover: "rgba(255,255,255,0.95)",
    border: "rgba(99,102,241,0.15)", borderSoft: "rgba(15,23,42,0.08)",
    glow: "rgba(99,102,241,0.06)",
  },
};

export const t5 = (dark: boolean) => dark ? C5.dark : C5.light;

// Neural network nodes floating
const NeuralNodes = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const nodes = [
    { x: 150, y: 120, size: 6, speed: 0.012, phase: 0 },
    { x: 400, y: 300, size: 8, speed: 0.008, phase: 1 },
    { x: 700, y: 180, size: 5, speed: 0.015, phase: 2 },
    { x: 1100, y: 400, size: 7, speed: 0.01, phase: 3 },
    { x: 1400, y: 200, size: 6, speed: 0.009, phase: 4 },
    { x: 1600, y: 600, size: 9, speed: 0.007, phase: 5 },
    { x: 300, y: 700, size: 5, speed: 0.013, phase: 6 },
    { x: 900, y: 550, size: 7, speed: 0.011, phase: 1.5 },
    { x: 1300, y: 750, size: 6, speed: 0.014, phase: 3.5 },
    { x: 600, y: 850, size: 8, speed: 0.006, phase: 2.5 },
  ];

  return (
    <AbsoluteFill style={{ opacity: dark ? 0.6 : 0.3 }}>
      {nodes.map((n, i) => {
        const nx = n.x + Math.sin(frame * n.speed + n.phase) * 30;
        const ny = n.y + Math.cos(frame * n.speed * 1.3 + n.phase) * 25;
        const pulse = 1 + Math.sin(frame * 0.06 + n.phase) * 0.4;
        return (
          <div key={i} style={{
            position: "absolute", left: nx - n.size, top: ny - n.size,
            width: n.size * 2, height: n.size * 2, borderRadius: "50%",
            background: i % 3 === 0 ? C5.electric : i % 3 === 1 ? C5.violet : C5.cyan,
            boxShadow: `0 0 ${20 * pulse}px ${(i % 3 === 0 ? C5.electric : i % 3 === 1 ? C5.violet : C5.cyan)}60`,
            transform: `scale(${pulse})`,
          }} />
        );
      })}
      {/* Connection lines between nearby nodes */}
      <svg width="1920" height="1080" style={{ position: "absolute", top: 0, left: 0 }}>
        {nodes.slice(0, 6).map((n1, i) => {
          const n2 = nodes[(i + 3) % nodes.length];
          const x1 = n1.x + Math.sin(frame * n1.speed + n1.phase) * 30;
          const y1 = n1.y + Math.cos(frame * n1.speed * 1.3 + n1.phase) * 25;
          const x2 = n2.x + Math.sin(frame * n2.speed + n2.phase) * 30;
          const y2 = n2.y + Math.cos(frame * n2.speed * 1.3 + n2.phase) * 25;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C5.electric} strokeWidth={0.5}
              opacity={0.15 + Math.sin(frame * 0.03 + i) * 0.1}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Data stream particles
const DataStream = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const streams = Array.from({ length: 8 }, (_, i) => ({
    x: 200 + i * 200,
    speed: 2 + (i % 3),
    color: [C5.electric, C5.violet, C5.cyan][i % 3],
  }));

  return (
    <AbsoluteFill style={{ opacity: dark ? 0.15 : 0.08 }}>
      {streams.map((s, i) => {
        const particles = Array.from({ length: 5 }, (_, j) => {
          const y = ((frame * s.speed + j * 220) % 1200) - 60;
          return (
            <div key={j} style={{
              position: "absolute", left: s.x + Math.sin(frame * 0.02 + j) * 15,
              top: y, width: 2, height: 12 + j * 4, borderRadius: 4,
              background: `linear-gradient(180deg, ${s.color}00, ${s.color}, ${s.color}00)`,
            }} />
          );
        });
        return <React.Fragment key={i}>{particles}</React.Fragment>;
      })}
    </AbsoluteFill>
  );
};

export const S5Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t5(dark);
  const angle = 140 + interpolate(frame, [0, 3500], [0, 25]);
  const bg = dark
    ? `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 40%, ${th.bg3} 100%)`
    : `linear-gradient(${angle}deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)`;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <NeuralNodes frame={frame} dark={dark} />
      <DataStream frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

export const S5Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
  frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number;
}) => {
  const th = t5(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const lineW = interpolate(s1, [0, 1], [0, 240]);
  const glowPulse = 0.6 + Math.sin(frame * 0.04) * 0.2;

  return (
    <div style={{ direction: "rtl", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{
          fontFamily: mono, fontSize: 13, letterSpacing: "0.2em", color: C5.electric,
          padding: "6px 16px", borderRadius: 20,
          background: `${C5.electric}10`, border: `1px solid ${C5.electric}25`,
          boxShadow: dark ? `0 0 15px ${C5.electric}15` : "none",
        }}>
          SEASON 05 — EP {String(episodeNum).padStart(2, "0")}
        </div>
        <div style={{
          width: lineW, height: 2,
          background: `linear-gradient(90deg, ${C5.electric}, ${C5.violet}, ${C5.cyan}50)`,
          boxShadow: dark ? `0 0 8px ${C5.electric}40` : "none",
          opacity: glowPulse,
        }} />
      </div>
      <div style={{
        fontFamily: cairo, fontSize: 66, fontWeight: 900, color: th.text,
        lineHeight: 1.15, marginBottom: 10,
        opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)`,
      }}>{titleAr}</div>
      <div style={{
        fontFamily: inter, fontSize: 32, fontWeight: 300,
        background: `linear-gradient(90deg, ${C5.electric}, ${C5.violet})`,
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

export const S5Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; titleAr: string; titleEn: string; desc: string; color: string;
}) => {
  const th = t5(dark);
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

export const S5Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; value: string; label: string; labelEn: string; color: string;
}) => {
  const th = t5(dark);
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

export const S5AIBrain = ({ frame, fps, dark, delay }: {
  frame: number; fps: number; dark: boolean; delay: number;
}) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.03;
  const r = interpolate(frame, [0, 1200], [0, 360]);

  return (
    <div style={{
      width: 360, height: 360, position: "relative",
      opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`,
    }}>
      {/* Rotating rings */}
      {[180, 230, 280, 320].map((size, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: "50%",
          width: size, height: size, borderRadius: "50%",
          border: `1px solid ${[C5.electric, C5.violet, C5.cyan, C5.magenta][i]}18`,
          transform: `translate(-50%, -50%) rotate(${r * (i % 2 === 0 ? 1 : -1) * (0.5 + i * 0.2)}deg)`,
        }}>
          <div style={{
            position: "absolute", top: -4, left: "50%", width: 8, height: 8, borderRadius: "50%",
            background: [C5.electric, C5.violet, C5.cyan, C5.magenta][i],
            transform: "translateX(-50%)", opacity: 0.7,
            boxShadow: `0 0 10px ${[C5.electric, C5.violet, C5.cyan, C5.magenta][i]}60`,
          }} />
        </div>
      ))}
      {/* Center brain icon */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        fontSize: 72,
      }}>🧠</div>
    </div>
  );
};

export const S5Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const th = t5(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.015;
  const r1 = interpolate(frame, [0, 800], [0, 360]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C5.electric}${dark ? "0C" : "06"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        border: `1px solid ${C5.violet}15`, transform: `rotate(${r1}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: C5.violet, transform: "translateX(-50%)", opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, transform: `scale(${interpolate(s1, [0, 1], [0.2, 1])})`, opacity: s1 }}>🧠</div>
        <div style={{
          fontFamily: inter, fontSize: 76, fontWeight: 900, color: th.text,
          transform: `scale(${pulse})`, opacity: s2, letterSpacing: "-0.02em",
        }}>
          <span style={{ background: `linear-gradient(90deg, ${C5.electric}, ${C5.violet})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 30, fontWeight: 700, color: C5.electric, opacity: s2 }}>سلسلة الذكاء الاصطناعي</div>
        <div style={{
          fontFamily: mono, fontSize: 14, color: th.muted, opacity: s3,
          background: th.card, padding: "10px 28px", borderRadius: 24,
          border: `1px solid ${th.borderSoft}`, letterSpacing: "0.1em",
        }}>
          SEASON 05 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: EP ${String(episodeNum + 1).padStart(2, "0")}` : "// END OF SEASON 05"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
