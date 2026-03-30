// Season 8 — Financial & Billing — "Gold Luxe" Style
// Refined gold accents, premium card designs, financial data visualizations
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadDM } from "@remotion/google-fonts/DMMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: playfair } = loadPlayfair("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: dm } = loadDM("normal", { weights: ["400"], subsets: ["latin"] });

export const C8 = {
  gold: "#D4A843", amber: "#F59E0B", bronze: "#CD7F32", emerald: "#10B981", navy: "#1E3A5F", cream: "#FFFDD0",
  dark: { bg: "#0A0A0F", bg2: "#141420", bg3: "#1E1E2E", text: "#FAF8F0", muted: "rgba(250,248,240,0.5)", card: "rgba(212,168,67,0.05)", border: "rgba(212,168,67,0.12)", borderSoft: "rgba(255,255,255,0.05)" },
  light: { bg: "#FFFDF5", bg2: "#FFF8E7", bg3: "#FFF3D0", text: "#1A1A2E", muted: "rgba(26,26,46,0.5)", card: "rgba(255,255,255,0.92)", border: "rgba(212,168,67,0.15)", borderSoft: "rgba(26,26,46,0.06)" },
};
export const t8 = (dark: boolean) => dark ? C8.dark : C8.light;

const GoldParticles = ({ frame, dark }: { frame: number; dark: boolean }) => (
  <AbsoluteFill style={{ opacity: dark ? 0.15 : 0.06 }}>
    <svg width="1920" height="1080">
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i * 137.5 + frame * 0.3) % 1920;
        const y = (i * 97.3 + Math.sin(frame * 0.02 + i) * 50) % 1080;
        const size = 2 + (i % 3);
        return <circle key={i} cx={x} cy={y} r={size} fill={C8.gold} opacity={0.3 + Math.sin(frame * 0.03 + i) * 0.2} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const S8Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t8(dark);
  const bg = dark ? `linear-gradient(135deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)` : `linear-gradient(135deg, ${th.bg} 0%, ${th.bg2} 50%, ${th.bg3} 100%)`;
  return <AbsoluteFill style={{ background: bg }}><GoldParticles frame={frame} dark={dark} />{children}</AbsoluteFill>;
};

export const S8Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: { frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number }) => {
  const th = t8(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: dm, fontSize: 13, letterSpacing: "0.2em", color: C8.gold, padding: "6px 16px", borderRadius: 20, background: `${C8.gold}10`, border: `1px solid ${C8.gold}25` }}>
          S08 — EP {String(episodeNum).padStart(2, "0")} — FINANCE
        </div>
        <div style={{ width: interpolate(s1, [0, 1], [0, 240]), height: 1, background: `linear-gradient(90deg, ${C8.gold}, ${C8.amber}, transparent)` }} />
      </div>
      <div style={{ fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text, lineHeight: 1.15, marginBottom: 10, opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)` }}>{titleAr}</div>
      <div style={{ fontFamily: playfair, fontSize: 30, fontWeight: 400, fontStyle: "italic", background: `linear-gradient(90deg, ${C8.gold}, ${C8.amber})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: s3 }}>{titleEn}</div>
      {subtitle && <div style={{ fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10, opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }) }}>{subtitle}</div>}
    </div>
  );
};

export const S8Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; titleAr: string; titleEn: string; desc: string; color: string }) => {
  const th = t8(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px", borderRadius: 16, background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)` }}>
      <div style={{ fontSize: 30, width: 54, height: 54, borderRadius: 14, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: dm, fontSize: 11, color, marginBottom: 8 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S8Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; value: string; label: string; labelEn: string; color: string }) => {
  const th = t8(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div style={{ width: 220, padding: "28px 22px", borderRadius: 20, textAlign: "center", background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)` }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: dm, fontSize: 32, fontWeight: 700, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: dm, fontSize: 11, color: th.muted }}>{labelEn}</div>
    </div>
  );
};

export const S8Outro = ({ frame, fps, dark, episodeNum, nextTitle }: { frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string }) => {
  const th = t8(dark); const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } }); const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } }); const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, opacity: s1 }}>💰</div>
        <div style={{ fontFamily: playfair, fontSize: 72, fontWeight: 900, color: th.text, opacity: s2 }}><span style={{ color: C8.gold }}>i</span>Recycle</div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C8.gold, opacity: s2 }}>سلسلة الإدارة المالية</div>
        <div style={{ fontFamily: dm, fontSize: 14, color: th.muted, opacity: s3, background: th.card, padding: "10px 28px", borderRadius: 24, border: `1px solid ${th.borderSoft}` }}>
          S08 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ ${nextTitle}` : "// END OF SEASON 08"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
