// Season 4 reuses Season 3's Clean Futuristic style with different accent colors
// Re-export everything from S3Common with S4-specific overrides
export { cairo, inter, mono, C, t, GlassCard, AnimCounter, ProgressRing, S3Feature as S4Feature, S3Stat as S4Stat, S3Dashboard as S4Dashboard } from "../season3/S3Common";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { cairo, inter, mono, C, t } from "../season3/S3Common";
import React from "react";

// S4 Background — warmer tones for shipments theme
const FloatingOrbs = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const orbs = [
    { x: 250, y: 180, size: 380, color: C.amber, speed: 0.008, phase: 0 },
    { x: 1450, y: 650, size: 320, color: C.emerald, speed: 0.006, phase: 2 },
    { x: 850, y: 250, size: 280, color: C.teal, speed: 0.01, phase: 4 },
    { x: 1550, y: 150, size: 240, color: C.cyan, speed: 0.007, phase: 1 },
  ];
  return (
    <AbsoluteFill>
      {orbs.map((o, i) => {
        const ox = o.x + Math.sin(frame * o.speed + o.phase) * 50;
        const oy = o.y + Math.cos(frame * o.speed * 1.3 + o.phase) * 35;
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

export const S4Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const angle = 135 + interpolate(frame, [0, 3500], [0, 20]);
  const bg = dark
    ? `linear-gradient(${angle}deg, #030712 0%, #0A0F1E 50%, #111827 100%)`
    : `linear-gradient(${angle}deg, #FAFBFD 0%, #F1F5F9 50%, #E8ECF1 100%)`;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <FloatingOrbs frame={frame} dark={dark} />
      {children}
    </AbsoluteFill>
  );
};

// S4 Header with Season 04 branding
export const S4Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: {
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
        <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: "0.2em", color: C.amber, padding: "6px 16px", borderRadius: 20, background: `${C.amber}10`, border: `1px solid ${C.amber}20` }}>
          SEASON 04 — EP {String(episodeNum).padStart(2, "0")}
        </div>
        <div style={{ width: lineW, height: 1, background: `linear-gradient(90deg, ${C.amber}, ${C.emerald}50)` }} />
      </div>
      <div style={{
        fontFamily: cairo, fontSize: 66, fontWeight: 900, color: th.text,
        lineHeight: 1.15, marginBottom: 10, letterSpacing: "-0.01em",
        opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)`,
      }}>{titleAr}</div>
      <div style={{
        fontFamily: inter, fontSize: 32, fontWeight: 300, color: C.amber,
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

// S4 Outro
export const S4Outro = ({ frame, fps, dark, episodeNum, nextTitle }: {
  frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string;
}) => {
  const th = t(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const pulse = 1 + Math.sin(frame * 0.05) * 0.015;
  const r1 = interpolate(frame, [0, 800], [0, 360]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.amber}${dark ? "0C" : "06"} 0%, transparent 60%)`,
        transform: `scale(${s1})`,
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        border: `1px solid ${C.amber}15`, transform: `rotate(${r1}deg)`, opacity: s1,
      }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: C.amber, transform: "translateX(-50%)", opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, transform: `scale(${interpolate(s1, [0, 1], [0.2, 1])})`, opacity: s1 }}>📦</div>
        <div style={{
          fontFamily: inter, fontSize: 76, fontWeight: 900, color: th.text,
          transform: `scale(${pulse})`, opacity: s2, letterSpacing: "-0.02em",
        }}>
          <span style={{ color: C.amber }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: cairo, fontSize: 30, fontWeight: 700, color: C.amber, opacity: s2 }}>سلسلة الشحنات</div>
        <div style={{
          fontFamily: mono, fontSize: 14, color: th.muted, opacity: s3,
          background: th.card, padding: "10px 28px", borderRadius: 24,
          border: `1px solid ${th.borderSoft}`, letterSpacing: "0.1em",
        }}>
          SEASON 04 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ NEXT: EP ${String(episodeNum + 1).padStart(2, "0")}` : "// END OF SEASON 04"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
