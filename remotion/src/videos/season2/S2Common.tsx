import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: mono } = loadJetBrains("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const COLORS = {
  green: "#22996E",
  blue: "#0EA5E9",
  silver: "#94A3B8",
  dark: { bg1: "#0B1120", bg2: "#0F1A2E", bg3: "#111827", grid: "rgba(34,153,110,0.06)", text: "#F1F5F9", muted: "rgba(241,245,249,0.4)", card: "rgba(255,255,255,0.03)", border: "rgba(34,153,110,0.12)" },
  light: { bg1: "#F8FAFC", bg2: "#F1F5F9", bg3: "#E2E8F0", grid: "rgba(34,153,110,0.08)", text: "#0F172A", muted: "rgba(15,23,42,0.5)", card: "rgba(255,255,255,0.8)", border: "rgba(34,153,110,0.15)" },
};

export const theme = (dark: boolean) => dark ? COLORS.dark : COLORS.light;

// Animated grid background
export const GridBackground = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const t = theme(dark);
  const drift = frame * 0.15;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 24; i++) {
    const x = (i * 80 + drift) % 1920;
    lines.push(<div key={`v${i}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: "100%", background: t.grid }} />);
  }
  for (let i = 0; i < 14; i++) {
    const y = (i * 80 + drift * 0.6) % 1080;
    lines.push(<div key={`h${i}`} style={{ position: "absolute", left: 0, top: y, width: "100%", height: 1, background: t.grid }} />);
  }
  // Intersection dots
  for (let i = 0; i < 6; i++) {
    const dx = ((i * 320 + drift * 1.2) % 1920);
    const dy = ((i * 240 + drift * 0.8 + 100) % 1080);
    const pulse = Math.sin((frame + i * 50) * 0.03) * 0.5 + 0.5;
    lines.push(<div key={`d${i}`} style={{ position: "absolute", left: dx - 3, top: dy - 3, width: 6, height: 6, borderRadius: "50%", background: COLORS.green, opacity: 0.1 + pulse * 0.15 }} />);
  }
  return <AbsoluteFill>{lines}</AbsoluteFill>;
};

// Geometric accent shapes
export const GeometricAccents = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const shapes: React.ReactNode[] = [];
  const configs = [
    { x: 1700, y: 80, size: 120, rot: frame * 0.3 },
    { x: 100, y: 900, size: 80, rot: -frame * 0.2 },
    { x: 1500, y: 800, size: 60, rot: frame * 0.5 },
  ];
  configs.forEach((c, i) => {
    const op = interpolate(Math.sin((frame + i * 60) * 0.02), [-1, 1], [0.03, 0.08]);
    shapes.push(
      <div key={i} style={{
        position: "absolute", left: c.x, top: c.y, width: c.size, height: c.size,
        border: `1px solid ${COLORS.green}`,
        borderRadius: i === 1 ? "50%" : 4,
        transform: `rotate(${c.rot}deg)`, opacity: op,
      }} />
    );
  });
  return <AbsoluteFill>{shapes}</AbsoluteFill>;
};

// Tech-style section header
export const SectionHeader = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
  frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number;
}) => {
  const t = theme(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 200 } });
  const s2 = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 200 } });
  const s3 = spring({ frame: frame - 25, fps, config: { damping: 18 } });
  const lineW = interpolate(s1, [0, 1], [0, 300]);
  const tagX = interpolate(s2, [0, 1], [-60, 0]);

  return (
    <div style={{ direction: "rtl", position: "relative" }}>
      {/* Episode tag */}
      <div style={{
        fontFamily: mono, fontSize: 14, color: COLORS.green,
        letterSpacing: "0.15em", marginBottom: 12,
        transform: `translateX(${tagX}px)`, opacity: s2,
      }}>
        SEASON 02 — EP {String(episodeNum).padStart(2, "0")}
      </div>
      {/* Line accent */}
      <div style={{ width: lineW, height: 2, background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.blue})`, marginBottom: 16, borderRadius: 1 }} />
      {/* Arabic title */}
      <div style={{
        fontFamily: cairo, fontSize: 52, fontWeight: 900, color: t.text,
        lineHeight: 1.2, marginBottom: 8,
        opacity: s3, transform: `translateY(${interpolate(s3, [0, 1], [30, 0])}px)`,
      }}>{titleAr}</div>
      {/* English title */}
      <div style={{
        fontFamily: inter, fontSize: 22, fontWeight: 700, color: COLORS.green,
        opacity: s3, marginBottom: subtitle ? 8 : 0,
      }}>{titleEn}</div>
      {subtitle && (
        <div style={{
          fontFamily: cairo, fontSize: 18, color: t.muted,
          opacity: spring({ frame: frame - 35, fps, config: { damping: 18 } }),
        }}>{subtitle}</div>
      )}
    </div>
  );
};

// Animated stat card (terminal style)
export const StatCard = ({ frame, fps, dark, delay, icon, value, label, labelEn }: {
  frame: number; fps: number; dark: boolean; delay: number;
  icon: string; value: string; label: string; labelEn?: string;
}) => {
  const t = theme(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 180 } });
  const y = interpolate(s, [0, 1], [50, 0]);
  const scanLine = interpolate(frame % 120, [0, 120], [0, 100]);

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`, borderRadius: 12,
      padding: "24px 28px", transform: `translateY(${y}px)`, opacity: s,
      position: "relative", overflow: "hidden", minWidth: 200,
    }}>
      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, top: `${scanLine}%`, width: "100%", height: 1,
        background: `linear-gradient(90deg, transparent, ${COLORS.green}15, transparent)`,
      }} />
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 700, color: COLORS.green, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, color: t.text, direction: "rtl" }}>{label}</div>
      {labelEn && <div style={{ fontFamily: inter, fontSize: 12, color: t.muted }}>{labelEn}</div>}
    </div>
  );
};

// Feature item with dot indicator
export const FeatureItem = ({ frame, fps, dark, delay, titleAr, titleEn, desc, color }: {
  frame: number; fps: number; dark: boolean; delay: number;
  titleAr: string; titleEn: string; desc: string; color?: string;
}) => {
  const t = theme(dark);
  const c = color || COLORS.green;
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 180 } });
  const x = interpolate(s, [0, 1], [80, 0]);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 16, direction: "rtl",
      transform: `translateX(${x}px)`, opacity: s,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", background: c,
        marginTop: 10, flexShrink: 0,
        boxShadow: `0 0 12px ${c}40`,
      }} />
      <div>
        <div style={{ fontFamily: cairo, fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 2 }}>{titleAr}</div>
        <div style={{ fontFamily: inter, fontSize: 13, color: c, marginBottom: 4 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 15, color: t.muted, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
};

// Dashboard mockup element
export const DashMockup = ({ frame, fps, dark, delay }: {
  frame: number; fps: number; dark: boolean; delay: number;
}) => {
  const t = theme(dark);
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 160 } });
  const scale = interpolate(s, [0, 1], [0.85, 1]);
  const bars = [65, 80, 45, 90, 55, 72, 88];

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`, borderRadius: 16,
      padding: 24, transform: `scale(${scale})`, opacity: s,
      width: 420,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[COLORS.green, COLORS.blue, COLORS.silver].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.6 }} />
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: t.muted }}>iRecycle Dashboard</div>
      </div>
      {/* Chart bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {bars.map((h, i) => {
          const barS = spring({ frame: frame - delay - 10 - i * 5, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              flex: 1, height: `${h * barS}%`, borderRadius: 4,
              background: i % 2 === 0 ? COLORS.green : COLORS.blue,
              opacity: 0.7 + barS * 0.3,
            }} />
          );
        })}
      </div>
    </div>
  );
};

// Background wrapper for episodes
export const S2Background = ({ frame, dark, children }: {
  frame: number; dark: boolean; children: React.ReactNode;
}) => {
  const t = theme(dark);
  const bgShift = interpolate(frame, [0, 2250], [0, 30]);
  const bg = dark
    ? `linear-gradient(${140 + bgShift}deg, ${COLORS.dark.bg1} 0%, ${COLORS.dark.bg2} 40%, ${COLORS.dark.bg3} 100%)`
    : `linear-gradient(${140 + bgShift}deg, ${COLORS.light.bg1} 0%, ${COLORS.light.bg2} 40%, ${COLORS.light.bg3} 100%)`;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GridBackground frame={frame} dark={dark} />
      <GeometricAccents frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

// Outro/closing scene
export const S2Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const t = theme(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const s3 = spring({ frame: frame - 60, fps, config: { damping: 18 } });
  const pulse = 1 + Math.sin(frame * 0.06) * 0.02;
  const ringRot = interpolate(frame, [0, 600], [0, 360]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.green}${dark ? "15" : "08"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      {/* Ring */}
      <div style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%",
        border: `1px solid ${COLORS.green}20`, transform: `rotate(${ringRot}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", top: -4, left: "50%", width: 8, height: 8, borderRadius: "50%", background: COLORS.green, transform: "translateX(-50%)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 1 }}>
        <div style={{ fontSize: 72, transform: `scale(${interpolate(s1, [0, 1], [0.3, 1])})`, opacity: s1 }}>♻️</div>
        <div style={{
          fontFamily: inter, fontSize: 72, fontWeight: 900, color: t.text,
          transform: `scale(${pulse})`, opacity: s2,
        }}>
          <span style={{ color: COLORS.green }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: COLORS.green, opacity: s2 }}>آي ريسايكل</div>
        <div style={{
          fontFamily: mono, fontSize: 14, color: t.muted, opacity: s3,
          background: t.card, padding: "8px 24px", borderRadius: 20,
          border: `1px solid ${t.border}`,
        }}>
          SEASON 02 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: EP ${String(episodeNum + 1).padStart(2, "0")}` : "// END OF SEASON 02"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
