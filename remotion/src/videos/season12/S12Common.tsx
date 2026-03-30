// Season 12 — Future Vision & Grand Finale — "Holographic" Style
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadBigShoulders } from "@remotion/google-fonts/BigShouldersDisplay";
import { loadFont as loadIBM } from "@remotion/google-fonts/IBMPlexMono";
import React from "react";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: bigShoulders } = loadBigShoulders("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
export const { fontFamily: ibm } = loadIBM("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const C12 = {
  prism: "#06B6D4", holo: "#8B5CF6", shine: "#F43F5E", mint: "#10B981", solar: "#FBBF24", ice: "#38BDF8",
  dark: { bg: "#020617", bg2: "#0F172A", bg3: "#1E293B", text: "#F1F5F9", muted: "rgba(241,245,249,0.5)", card: "rgba(6,182,212,0.05)", border: "rgba(6,182,212,0.12)", borderSoft: "rgba(255,255,255,0.05)" },
  light: { bg: "#F0FDFA", bg2: "#E0F2FE", bg3: "#CCFBF1", text: "#0C4A6E", muted: "rgba(12,74,110,0.5)", card: "rgba(255,255,255,0.92)", border: "rgba(6,182,212,0.18)", borderSoft: "rgba(12,74,110,0.06)" },
};
export const t12 = (dark: boolean) => dark ? C12.dark : C12.light;

const HoloRays = ({ frame, dark }: { frame: number; dark: boolean }) => (
  <AbsoluteFill style={{ opacity: dark ? 0.1 : 0.04 }}>
    <svg width="1920" height="1080">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 + frame * 0.005;
        const x2 = 960 + Math.cos(angle) * 1200;
        const y2 = 540 + Math.sin(angle) * 800;
        const colors = [C12.prism, C12.holo, C12.shine, C12.mint, C12.solar, C12.ice];
        return <line key={i} x1="960" y1="540" x2={x2} y2={y2} stroke={colors[i % 6]} strokeWidth="1" opacity={0.2 + Math.sin(frame * 0.03 + i) * 0.1} />;
      })}
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (i * 197 + frame * 0.4) % 1920;
        const y = (i * 113 + Math.sin(frame * 0.02 + i) * 40) % 1080;
        return <circle key={`s${i}`} cx={x} cy={y} r={1.5 + (i % 3)} fill={[C12.prism, C12.holo, C12.shine][i % 3]} opacity={0.3 + Math.sin(frame * 0.05 + i * 1.7) * 0.2} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const S12Background = ({ frame, dark, children }: { frame: number; dark: boolean; children: React.ReactNode }) => {
  const th = t12(dark);
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${th.bg}, ${th.bg2}, ${th.bg3})` }}><HoloRays frame={frame} dark={dark} />{children}</AbsoluteFill>;
};

export const S12Header = ({ frame, fps, dark, titleAr, titleEn, subtitle, episodeNum }: { frame: number; fps: number; dark: boolean; titleAr: string; titleEn: string; subtitle?: string; episodeNum: number }) => {
  const th = t12(dark);
  const s1 = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 180 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: s1 }}>
        <div style={{ fontFamily: ibm, fontSize: 13, letterSpacing: "0.2em", color: C12.prism, padding: "6px 16px", borderRadius: 20, background: `${C12.prism}10`, border: `1px solid ${C12.prism}25` }}>
          S12 — EP {String(episodeNum).padStart(2, "0")} — FUTURE
        </div>
        <div style={{ width: interpolate(s1, [0, 1], [0, 240]), height: 1, background: `linear-gradient(90deg, ${C12.prism}, ${C12.holo}, ${C12.shine}, transparent)` }} />
      </div>
      <div style={{ fontFamily: cairo, fontSize: 64, fontWeight: 900, color: th.text, lineHeight: 1.15, marginBottom: 10, opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [25, 0])}px)` }}>{titleAr}</div>
      <div style={{ fontFamily: bigShoulders, fontSize: 32, fontWeight: 900, background: `linear-gradient(90deg, ${C12.prism}, ${C12.holo}, ${C12.shine})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: s3 }}>{titleEn}</div>
      {subtitle && <div style={{ fontFamily: cairo, fontSize: 22, color: th.muted, marginTop: 10, opacity: spring({ frame: frame - 40, fps, config: { damping: 18 } }) }}>{subtitle}</div>}
    </div>
  );
};

export const S12Feature = ({ frame, fps, dark, delay, icon, titleAr, titleEn, desc, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; titleAr: string; titleEn: string; desc: string; color: string }) => {
  const th = t12(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 24px", borderRadius: 16, background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)` }}>
      <div style={{ fontSize: 30, width: 54, height: 54, borderRadius: 14, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 4 }}>{titleAr}</div>
        <div style={{ fontFamily: ibm, fontSize: 11, color, marginBottom: 8 }}>{titleEn}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: th.muted, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
};

export const S12Stat = ({ frame, fps, dark, delay, icon, value, label, labelEn, color }: { frame: number; fps: number; dark: boolean; delay: number; icon: string; value: string; label: string; labelEn: string; color: string }) => {
  const th = t12(dark); const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div style={{ width: 220, padding: "28px 22px", borderRadius: 20, textAlign: "center", background: th.card, border: `1px solid ${th.borderSoft}`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)` }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: ibm, fontSize: 32, fontWeight: 700, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: ibm, fontSize: 11, color: th.muted }}>{labelEn}</div>
    </div>
  );
};

export const S12Outro = ({ frame, fps, dark, episodeNum, nextTitle }: { frame: number; fps: number; dark: boolean; episodeNum: number; nextTitle?: string }) => {
  const th = t12(dark); const s1 = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80, mass: 2 } }); const s2 = spring({ frame: frame - 35, fps, config: { damping: 18 } }); const s3 = spring({ frame: frame - 65, fps, config: { damping: 20 } }); const s4 = spring({ frame: frame - 90, fps, config: { damping: 15 } });
  const isFinale = !nextTitle;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        <div style={{ fontSize: 80, opacity: s1 }}>{isFinale ? "🏆" : "🚀"}</div>
        <div style={{ fontFamily: bigShoulders, fontSize: 72, fontWeight: 900, background: `linear-gradient(90deg, ${C12.prism}, ${C12.holo}, ${C12.shine})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: s2 }}>iRecycle</div>
        <div style={{ fontFamily: cairo, fontSize: 28, fontWeight: 700, color: C12.prism, opacity: s2 }}>{isFinale ? "نهاية السلسلة — شكراً لمتابعتكم" : "سلسلة الرؤية المستقبلية"}</div>
        {isFinale && <div style={{ fontFamily: cairo, fontSize: 20, color: th.muted, opacity: s4, textAlign: "center", maxWidth: 600 }}>١٢ موسم • ٧٢ حلقة • رحلة شاملة في عالم إدارة المخلفات الذكية</div>}
        <div style={{ fontFamily: ibm, fontSize: 14, color: th.muted, opacity: s3, background: th.card, padding: "10px 28px", borderRadius: 20, border: `1px solid ${th.borderSoft}` }}>
          S12 — EP {String(episodeNum).padStart(2, "0")} {nextTitle ? `→ ${nextTitle}` : "// THE GRAND FINALE ✨"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
