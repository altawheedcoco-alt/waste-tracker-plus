// Season 11 — Integration & Connectivity — "Cosmic Network" Style
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: orbitron } = loadOrbitron("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: space } = loadSpace("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C11 = {
  nebula: "#7C3AED", cosmic: "#A855F7", stellar: "#6366F1", plasma: "#EC4899", supernova: "#F97316", aurora: "#14B8A6",
  dark: { bg: "#070318", bg2: "#0F0A2A", bg3: "#1A1040", text: "#EDE9FE", muted: "rgba(237,233,254,0.5)", card: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.12)", borderSoft: "rgba(255,255,255,0.05)" },
  light: { bg: "#FAF5FF", bg2: "#F3E8FF", bg3: "#E9D5FF", text: "#1E1040", muted: "rgba(30,16,64,0.5)", card: "rgba(255,255,255,0.92)", border: "rgba(124,58,237,0.15)", borderSoft: "rgba(30,16,64,0.06)" },
};
export const t11 = (dark: boolean) => dark ? C11.dark : C11.light;

const CosmicStars = ({ frame, dark }: { frame: number; dark: boolean }) => (
  <AbsoluteFill style={{ opacity: dark ? 0.2 : 0.06 }}>
    <svg width="1920" height="1080">
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (i * 173.7 + frame * 0.15) % 1920;
        const y = (i * 89.3 + Math.sin(frame * 0.015 + i) * 30) % 1080;
        const s = 1 + (i % 4);
        const twinkle = 0.3 + Math.sin(frame * 0.04 + i * 2.1) * 0.3;
        return <circle key={i} cx={x} cy={y} r={s} fill={[C11.nebula, C11.cosmic, C11.stellar, C11.plasma][i % 4]} opacity={twinkle} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const S11Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t11(dark);
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${th.bg}, ${th.bg2}, ${th.bg3})` }}><CosmicStars frame={frame} dark={dark} />{children}</AbsoluteFill>;
};

export const S11Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: { frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number }) => {
  const th = t11(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: space, fontSize: 13, letterSpacing: "0.2em", color: C11.cosmic, padding: "6px 16px", borderRadius: 20, background: `${C11.cosmic}10`, border: `1px solid ${C11.cosmic}25` }}>
          S11 — EP {String(episodeNum).padStart(2, "0")} — INTEGRATION
        </div>
        <div style={{ width: interpolate(s1, [0, 1], [0, 240]), height: 1, background: `linear-gradient(90deg, ${C11.nebula}, ${C11.cosmic}, transparent)` }} />
      </div>
      <div style={{ fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text, lineHeight: 1.15, marginBottom: 10, opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)` }}>{titleAr}</div>
      <div style={{ fontFamily: orbitron, fontSize: 26, fontWeight: 700, background: `linear-gradient(90deg, ${C11.nebula}, ${C11.cosmic})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: s3 }}>{titleEn}</div>
      {subtitle && <div style={{ fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10, opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }) }}>{subtitle}</div>}
    </div>
  );
};

export const S11Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; titleAr: string; titleEn: string; desc: string; color: string }) => {
  const th = t11(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px", borderRadius: 16, background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)` }}>
      <div style={{ fontSize: 30, width: 54, height: 54, borderRadius: 14, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: space, fontSize: 11, color, marginBottom: 8 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S11Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; value: string; label: string; labelEn: string; color: string }) => {
  const th = t11(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div style={{ width: 220, padding: "28px 22px", borderRadius: 20, textAlign: "center", background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)` }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: space, fontSize: 32, fontWeight: 700, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: space, fontSize: 11, color: th.muted }}>{labelEn}</div>
    </div>
  );
};

export const S11Outro = ({ frame, fps, dark, episodeNum, nextTitle }: { frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string }) => {
  const th = t11(dark); const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } }); const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } }); const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, opacity: s1 }}>🌌</div>
        <div style={{ fontFamily: orbitron, fontSize: 64, fontWeight: 900, color: th.text, opacity: s2 }}><span style={{ color: C11.cosmic }}>i</span>Recycle</div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C11.cosmic, opacity: s2 }}>سلسلة التكامل والربط</div>
        <div style={{ fontFamily: space, fontSize: 14, color: th.muted, opacity: s3, background: th.card, padding: "10px 28px", borderRadius: 20, border: `1px solid ${th.borderSoft}` }}>
          S11 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ ${nextTitle}` : "// END OF SEASON 11"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
