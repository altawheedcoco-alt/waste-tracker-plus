// Season 10 — Legal & Compliance — "Legal Blueprint" Style
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: cormorant } = loadCormorant("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const { fontFamily: jetbrains } = loadJetBrains("normal", { weights: ["400"], subsets: ["latin"] });

export const C10 = {
  navy: "#1E3A5F", royal: "#2563EB", slate: "#475569", parchment: "#F5F0E8", seal: "#B91C1C", gold: "#D4A843",
  dark: { bg: "#0A0E1A", bg2: "#111827", bg3: "#1E293B", text: "#E2E8F0", muted: "rgba(226,232,240,0.5)", card: "rgba(30,58,95,0.08)", border: "rgba(37,99,235,0.12)", borderSoft: "rgba(255,255,255,0.05)" },
  light: { bg: "#F8FAFC", bg2: "#F1F5F9", bg3: "#E2E8F0", text: "#0F172A", muted: "rgba(15,23,42,0.5)", card: "rgba(255,255,255,0.92)", border: "rgba(30,58,95,0.15)", borderSoft: "rgba(15,23,42,0.06)" },
};
export const t10 = (dark: boolean) => dark ? C10.dark : C10.light;

const BlueprintLines = ({ frame, dark }: { frame: number; dark: boolean }) => (
  <AbsoluteFill style={{ opacity: dark ? 0.06 : 0.03 }}>
    <svg width="1920" height="1080">
      {Array.from({ length: 15 }).map((_, i) => {
        const y = i * 72; const dashOffset = frame * 0.5;
        return <line key={i} x1="0" y1={y} x2="1920" y2={y} stroke={C10.royal} strokeWidth="0.5" strokeDasharray="8 12" strokeDashoffset={dashOffset} />;
      })}
      {Array.from({ length: 28 }).map((_, i) => {
        const x = i * 70; const dashOffset = -frame * 0.3;
        return <line key={`v${i}`} x1={x} y1="0" x2={x} y2="1080" stroke={C10.royal} strokeWidth="0.5" strokeDasharray="8 12" strokeDashoffset={dashOffset} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const S10Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t10(dark);
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${th.bg}, ${th.bg2}, ${th.bg3})` }}><BlueprintLines frame={frame} dark={dark} />{children}</AbsoluteFill>;
};

export const S10Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: { frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number }) => {
  const th = t10(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: jetbrains, fontSize: 13, letterSpacing: "0.2em", color: C10.royal, padding: "6px 16px", borderRadius: 4, background: `${C10.royal}10`, border: `1px solid ${C10.royal}25` }}>
          S10 — EP {String(episodeNum).padStart(2, "0")} — LEGAL
        </div>
        <div style={{ width: interpolate(s1, [0, 1], [0, 240]), height: 1, background: `linear-gradient(90deg, ${C10.navy}, ${C10.royal}, transparent)` }} />
      </div>
      <div style={{ fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text, lineHeight: 1.15, marginBottom: 10, opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)` }}>{titleAr}</div>
      <div style={{ fontFamily: cormorant, fontSize: 30, fontWeight: 700, fontStyle: "italic", color: C10.royal, opacity: s3 }}>{titleEn}</div>
      {subtitle && <div style={{ fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10, opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }) }}>{subtitle}</div>}
    </div>
  );
};

export const S10Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; titleAr: string; titleEn: string; desc: string; color: string }) => {
  const th = t10(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px", borderRadius: 12, background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)` }}>
      <div style={{ fontSize: 30, width: 54, height: 54, borderRadius: 12, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: jetbrains, fontSize: 11, color, marginBottom: 8 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S10Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; value: string; label: string; labelEn: string; color: string }) => {
  const th = t10(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div style={{ width: 220, padding: "28px 22px", borderRadius: 16, textAlign: "center", background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)` }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: jetbrains, fontSize: 32, fontWeight: 700, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: jetbrains, fontSize: 11, color: th.muted }}>{labelEn}</div>
    </div>
  );
};

export const S10Outro = ({ frame, fps, dark, episodeNum, nextTitle }: { frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string }) => {
  const th = t10(dark); const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } }); const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } }); const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, opacity: s1 }}>⚖️</div>
        <div style={{ fontFamily: cormorant, fontSize: 72, fontWeight: 900, color: th.text, opacity: s2 }}><span style={{ color: C10.royal }}>i</span>Recycle</div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C10.royal, opacity: s2 }}>سلسلة القانون والامتثال</div>
        <div style={{ fontFamily: jetbrains, fontSize: 14, color: th.muted, opacity: s3, background: th.card, padding: "10px 28px", borderRadius: 12, border: `1px solid ${th.borderSoft}` }}>
          S10 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ ${nextTitle}` : "// END OF SEASON 10"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
