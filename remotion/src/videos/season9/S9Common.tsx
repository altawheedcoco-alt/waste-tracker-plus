// Season 9 — HR & Workforce — "Military Tactical" Style
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadRajdhani } from "@remotion/google-fonts/Rajdhani";
import { loadFont as loadShare } from "@remotion/google-fonts/ShareTechMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: rajdhani } = loadRajdhani("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const { fontFamily: share } = loadShare("normal", { weights: ["400"], subsets: ["latin"] });

export const C9 = {
  olive: "#6B8E23", khaki: "#BDB76B", tactical: "#4A6741", amber: "#D4A017", rust: "#8B4513", steel: "#708090",
  dark: { bg: "#0D1208", bg2: "#1A2414", bg3: "#243020", text: "#E8F0DC", muted: "rgba(232,240,220,0.5)", card: "rgba(107,142,35,0.06)", border: "rgba(107,142,35,0.15)", borderSoft: "rgba(255,255,255,0.05)" },
  light: { bg: "#F5F7F0", bg2: "#EEF2E6", bg3: "#E0E8D0", text: "#1A2414", muted: "rgba(26,36,20,0.5)", card: "rgba(255,255,255,0.92)", border: "rgba(107,142,35,0.18)", borderSoft: "rgba(26,36,20,0.06)" },
};
export const t9 = (dark: boolean) => dark ? C9.dark : C9.light;

const TacticalGrid = ({ frame, dark }: { frame: number; dark: boolean }) => (
  <AbsoluteFill style={{ opacity: dark ? 0.08 : 0.04 }}>
    <svg width="1920" height="1080">
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 54} x2="1920" y2={i * 54} stroke={C9.olive} strokeWidth="0.5" opacity={0.3 + Math.sin(frame * 0.02 + i) * 0.15} />
      ))}
      {Array.from({ length: 36 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 54} y1="0" x2={i * 54} y2="1080" stroke={C9.olive} strokeWidth="0.5" opacity={0.3 + Math.cos(frame * 0.02 + i) * 0.15} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i * 240 + frame * 0.5) % 1920;
        return <circle key={`d${i}`} cx={x} cy={540} r={3} fill={C9.amber} opacity={0.4 + Math.sin(frame * 0.04 + i) * 0.2} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const S9Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t9(dark);
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${th.bg}, ${th.bg2}, ${th.bg3})` }}><TacticalGrid frame={frame} dark={dark} />{children}</AbsoluteFill>;
};

export const S9Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: { frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number }) => {
  const th = t9(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: share, fontSize: 13, letterSpacing: "0.2em", color: C9.olive, padding: "6px 16px", borderRadius: 4, background: `${C9.olive}10`, border: `1px solid ${C9.olive}25` }}>
          S09 — EP {String(episodeNum).padStart(2, "0")} — WORKFORCE
        </div>
        <div style={{ width: interpolate(s1, [0, 1], [0, 240]), height: 1, background: `linear-gradient(90deg, ${C9.olive}, ${C9.khaki}, transparent)` }} />
      </div>
      <div style={{ fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text, lineHeight: 1.15, marginBottom: 10, opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)` }}>{titleAr}</div>
      <div style={{ fontFamily: rajdhani, fontSize: 30, fontWeight: 700, color: C9.olive, textTransform: "uppercase", letterSpacing: "0.05em", opacity: s3 }}>{titleEn}</div>
      {subtitle && <div style={{ fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10, opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }) }}>{subtitle}</div>}
    </div>
  );
};

export const S9Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; titleAr: string; titleEn: string; desc: string; color: string }) => {
  const th = t9(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px", borderRadius: 8, background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)` }}>
      <div style={{ fontSize: 30, width: 54, height: 54, borderRadius: 8, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: share, fontSize: 11, color, marginBottom: 8 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S9Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; value: string; label: string; labelEn: string; color: string }) => {
  const th = t9(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div style={{ width: 220, padding: "28px 22px", borderRadius: 12, textAlign: "center", background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)` }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: share, fontSize: 32, fontWeight: 700, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: share, fontSize: 11, color: th.muted }}>{labelEn}</div>
    </div>
  );
};

export const S9Outro = ({ frame, fps, dark, episodeNum, nextTitle }: { frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string }) => {
  const th = t9(dark); const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } }); const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } }); const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, opacity: s1 }}>🎖️</div>
        <div style={{ fontFamily: rajdhani, fontSize: 72, fontWeight: 900, color: th.text, opacity: s2 }}><span style={{ color: C9.olive }}>i</span>Recycle</div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C9.olive, opacity: s2 }}>سلسلة الموارد البشرية</div>
        <div style={{ fontFamily: share, fontSize: 14, color: th.muted, opacity: s3, background: th.card, padding: "10px 28px", borderRadius: 8, border: `1px solid ${th.borderSoft}` }}>
          S09 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ ${nextTitle}` : "// END OF SEASON 09"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
